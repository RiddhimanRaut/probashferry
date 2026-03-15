import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import config from "../../../../content/config.json";

const DRIVE_SUBMISSIONS_ROOT = process.env.GOOGLE_DRIVE_SUBMISSIONS_FOLDER_ID!;

function getDriveClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/drive"],
  });
  return google.drive({ version: "v3", auth });
}

async function findOrCreateFolder(
  drive: ReturnType<typeof google.drive>,
  name: string,
  parentId: string
): Promise<string> {
  const res = await drive.files.list({
    q: `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
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
    const category = formData.get("category") as string;
    const title = formData.get("title") as string;
    const author = formData.get("author") as string;
    const excerpt = formData.get("excerpt") as string;
    const lang = (formData.get("lang") as string) || "en";
    const flavor = formData.get("flavor") as string | null;
    const type = formData.get("type") as string | null;

    if (!category || !title || !author || !excerpt) {
      return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
    }

    const drive = getDriveClient();

    // Find the pending folder for the active issue
    const issueFolder = await findOrCreateFolder(drive, config.activeIssue, DRIVE_SUBMISSIONS_ROOT);
    const pendingFolder = await findOrCreateFolder(drive, "pending", issueFolder);

    // Create a slug from title + timestamp for uniqueness
    const slug = `${category.toLowerCase()}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}-${Date.now()}`;
    const submissionFolder = await findOrCreateFolder(drive, slug, pendingFolder);

    // Build meta.json
    const meta: Record<string, unknown> = { title, author, excerpt, category, lang };
    if (flavor) meta.flavor = flavor;
    if (type) meta.type = type;

    // Handle per-category files
    if (category === "Essays") {
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
      // Photography, Art, Comics
      const cover = formData.get("cover") as File | null;
      if (!cover) return NextResponse.json({ error: "Cover image required." }, { status: 400 });
      const cbuf = Buffer.from(await cover.arrayBuffer());
      const coverExt = cover.name.split(".").pop();
      await uploadFile(drive, `cover.${coverExt}`, cover.type, cbuf, submissionFolder);
      meta.coverImage = `cover.${coverExt}`;

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

    return NextResponse.json({ success: true, slug });
  } catch (err) {
    console.error("Submit error:", err);
    return NextResponse.json({ error: "Submission failed. Please try again." }, { status: 500 });
  }
}
