import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import config from "../../../../content/config.json";

const DRIVE_SUBMISSIONS_ROOT = process.env.GOOGLE_DRIVE_SUBMISSIONS_FOLDER_ID!;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY!;
const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!;
const FS_BASE = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

/** Parse the service account JSON, handling both real newlines and escaped \n. */
function getServiceAccountCredentials() {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON!;
  // Try parsing as-is first (works when env var has escaped \n)
  try { return JSON.parse(raw); } catch { /* fall through */ }
  // Replace real newlines with escaped \n (works when env var has literal newlines)
  return JSON.parse(raw.replace(/\n/g, "\\n"));
}

function getDriveClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_DRIVE_CLIENT_ID,
    process.env.GOOGLE_DRIVE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({
    refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN,
  });
  return google.drive({ version: "v3", auth: oauth2Client });
}

/** Verify a Firebase ID token and return the uid, or null if invalid. */
async function verifyIdToken(idToken: string): Promise<string | null> {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken }),
    }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return (data.users?.[0]?.localId as string) ?? null;
}

/** Get a Firestore access token using the service account. */
async function getFirestoreToken(): Promise<string> {
  const auth = new google.auth.GoogleAuth({
    credentials: getServiceAccountCredentials(),
    scopes: ["https://www.googleapis.com/auth/datastore"],
  });
  const client = await auth.getClient();
  const token = await client.getAccessToken();
  return token.token!;
}

/** Check if a Firestore document exists. */
async function fsDocExists(path: string, token: string): Promise<boolean> {
  const res = await fetch(`${FS_BASE}/${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.status === 200;
}

/** Write a Firestore document. */
async function fsSetDoc(
  path: string,
  fields: Record<string, { stringValue: string }>,
  token: string
): Promise<void> {
  const res = await fetch(`${FS_BASE}/${path}`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ fields }),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`Firestore write failed (${res.status}):`, body);
  }
}

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string
): Promise<string> {
  const res = await drive.files.list({
    q: `name='${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    fields: "files(id)",
  });
  if (res.data.files?.length) return res.data.files[0].id!;
  const created = await drive.files.create({
    requestBody: { name, mimeType: "application/vnd.google-apps.folder", parents: [parentId] },
    fields: "id",
  });
  return created.data.id!;
}

async function uploadFile(
  drive: ReturnType<typeof google.drive>,
  name: string,
  mimeType: string,
  buffer: Buffer,
  parentId: string
) {
  const stream = Readable.from(buffer);
  await drive.files.create({
    requestBody: { name, parents: [parentId] },
    media: { mimeType, body: stream },
  });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const idToken = formData.get("idToken") as string | null;
    const category = formData.get("category") as string;
    const title = (formData.get("title") as string) || "";
    const author = formData.get("author") as string;
    const lang = (formData.get("lang") as string) || "en";
    const flavor = formData.get("flavor") as string | null;
    const type = formData.get("type") as string | null;

    if (!idToken) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    if (!category || !author) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }
    // Letters and Comics require an overall title
    if ((category === "Letters" || category === "Comics") && !title) {
      return NextResponse.json({ error: "Title is required." }, { status: 400 });
    }

    // Verify Firebase ID token
    const uid = await verifyIdToken(idToken);
    if (!uid) {
      return NextResponse.json({ error: "Invalid or expired session. Please sign in again." }, { status: 401 });
    }

    // Check for duplicate submission
    const submissionKey = `${uid}_${category}_${config.activeIssue}`.replace(/[^a-zA-Z0-9_-]/g, "_");
    const fsToken = await getFirestoreToken();
    const alreadySubmitted = await fsDocExists(`submissions/${submissionKey}`, fsToken);
    if (alreadySubmitted) {
      return NextResponse.json(
        { error: `You have already submitted to ${category} for this issue.` },
        { status: 409 }
      );
    }

    const drive = getDriveClient();

    // Find the pending folder for the active issue, organized by category
    const issueFolder = await findOrCreateFolder(drive, config.activeIssue, DRIVE_SUBMISSIONS_ROOT);
    const pendingFolder = await findOrCreateFolder(drive, "pending", issueFolder);
    const categoryFolder = await findOrCreateFolder(drive, category, pendingFolder);

    // Human-readable folder name: author_title_uid (uid suffix for uniqueness)
    // Keep Unicode letters (Bengali, etc.), strip only punctuation and special chars
    // eslint-disable-next-line no-control-regex
    const slugify = (s: string, max: number) => s.toLowerCase().replace(/[\x00-\x2F\x3A-\x40\x5B-\x60\x7B-\x7F]+/g, "-").replace(/^-|-$/g, "").slice(0, max);
    const authorSlug = slugify(author, 30);
    const titleSlug = title ? `_${slugify(title, 40)}` : "";
    const slug = `${authorSlug}${titleSlug}_${uid.slice(-6)}`;
    const submissionFolder = await findOrCreateFolder(drive, slug, categoryFolder);

    // Build meta.json
    const meta: Record<string, unknown> = { author, category, lang };
    if (title) meta.title = title;
    if (flavor) meta.flavor = flavor;
    if (type) meta.type = type;

    // Handle per-category files
    if (category === "Letters") {
      const manuscript = formData.get("manuscript") as File | null;
      if (!manuscript) return NextResponse.json({ error: "Manuscript file required." }, { status: 400 });
      const buf = Buffer.from(await manuscript.arrayBuffer());
      await uploadFile(drive, "manuscript.docx", manuscript.type, buf, submissionFolder);

      const cover = formData.get("cover") as File | null;
      if (cover) {
        const cbuf = Buffer.from(await cover.arrayBuffer());
        await uploadFile(drive, `cover.${cover.name.split(".").pop()}`, cover.type, cbuf, submissionFolder);
        meta.coverImage = `cover.${cover.name.split(".").pop()}`;
      }
    } else {
      // Photography, Art, Comics — no cover required (editors select from submitted photos)
      // Individual photos/panels
      const photos: Record<string, unknown>[] = [];
      let i = 0;
      while (formData.has(`photo_${i}_file`)) {
        const file = formData.get(`photo_${i}_file`) as File;
        const caption = (formData.get(`photo_${i}_caption`) as string) || "";
        const photoTitle = (formData.get(`photo_${i}_title`) as string) || "";
        const medium = (formData.get(`photo_${i}_medium`) as string) || undefined;
        const ext = file.name.split(".").pop();
        const filename = `photo_${String(i).padStart(2, "0")}.${ext}`;
        const buf = Buffer.from(await file.arrayBuffer());
        await uploadFile(drive, filename, file.type, buf, submissionFolder);

        const photoEntry: Record<string, unknown> = { src: filename, caption };
        if (photoTitle) photoEntry.title = photoTitle;
        if (medium) photoEntry.medium = medium;

        // Comics panels
        const panels: string[] = [];
        let p = 0;
        while (formData.has(`photo_${i}_panel_${p}`)) {
          const panel = formData.get(`photo_${i}_panel_${p}`) as File;
          const panelExt = panel.name.split(".").pop();
          const panelName = `photo_${String(i).padStart(2, "0")}_panel_${String(p).padStart(2, "0")}.${panelExt}`;
          const pbuf = Buffer.from(await panel.arrayBuffer());
          await uploadFile(drive, panelName, panel.type, pbuf, submissionFolder);
          panels.push(panelName);
          p++;
        }
        if (panels.length > 0) photoEntry.panels = panels;

        photos.push(photoEntry);
        i++;
      }
      if (photos.length > 0) meta.photos = photos;
    }

    // Write meta.json
    const metaBuffer = Buffer.from(JSON.stringify(meta, null, 2));
    await uploadFile(drive, "meta.json", "application/json", metaBuffer, submissionFolder);

    // Record submission in Firestore to prevent duplicates
    await fsSetDoc(
      `submissions/${submissionKey}`,
      {
        uid: { stringValue: uid },
        category: { stringValue: category },
        issue: { stringValue: config.activeIssue },
        slug: { stringValue: slug },
        submittedAt: { stringValue: new Date().toISOString() },
      },
      fsToken
    );

    return NextResponse.json({ success: true, slug });
  } catch (err) {
    const errMsg = err instanceof Error ? `${err.message} | ${err.stack?.split("\n")[1]?.trim()}` : String(err);
    console.error("Submit error:", errMsg);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
