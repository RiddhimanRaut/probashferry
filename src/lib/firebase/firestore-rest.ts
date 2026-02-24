/**
 * Thin Firestore REST client — bypasses the Firebase JS SDK's broken
 * WebChannel transport while keeping the same read/write semantics.
 */

import { getFirebaseAuth } from "./config";

const PID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const BASE = `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents`;

// ---- value conversion ----

function toValue(v: unknown): Record<string, unknown> {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  return { stringValue: String(v) };
}

function fromValue(v: Record<string, unknown>): unknown {
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("timestampValue" in v) return v.timestampValue;
  if ("nullValue" in v) return null;
  return null;
}

function toFields(obj: Record<string, unknown>): Record<string, Record<string, unknown>> {
  const fields: Record<string, Record<string, unknown>> = {};
  for (const [k, v] of Object.entries(obj)) fields[k] = toValue(v);
  return fields;
}

function fromFields(fields: Record<string, Record<string, unknown>>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(fields)) result[k] = fromValue(v);
  return result;
}

async function authHeaders(): Promise<HeadersInit> {
  const user = getFirebaseAuth().currentUser;
  if (!user) throw new Error("Not authenticated");
  const token = await user.getIdToken();
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

// ---- reads (public, use API key) ----

export async function getDoc(path: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(`${BASE}/${path}?key=${KEY}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET ${path}: ${res.status}`);
  return fromFields((await res.json()).fields || {});
}

export async function queryDocs(
  collectionPath: string,
  orderByField: string,
  direction: "ASCENDING" | "DESCENDING" = "DESCENDING"
): Promise<Array<{ id: string } & Record<string, unknown>>> {
  const parts = collectionPath.split("/");
  const collectionId = parts.pop()!;
  const parentPath = parts.join("/");
  const parent = parentPath ? `${BASE}/${parentPath}` : BASE;

  const res = await fetch(`${parent}:runQuery?key=${KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        orderBy: [{ field: { fieldPath: orderByField }, direction }],
      },
    }),
  });
  if (!res.ok) throw new Error(`Query ${collectionPath}: ${res.status}`);
  const results = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return results.filter((r: any) => r.document).map((r: any) => ({
    id: r.document.name.split("/").pop()!,
    ...fromFields(r.document.fields || {}),
  }));
}

// ---- writes (authenticated) ----

export async function setDoc(path: string, data: Record<string, unknown>): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/${path}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`SET ${path}: ${res.status} ${(await res.json()).error?.message || ""}`);
}

export async function mergeDoc(path: string, data: Record<string, unknown>): Promise<void> {
  const headers = await authHeaders();
  const mask = Object.keys(data).map((k) => `updateMask.fieldPaths=${k}`).join("&");
  const res = await fetch(`${BASE}/${path}?${mask}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`MERGE ${path}: ${res.status} ${(await res.json()).error?.message || ""}`);
}

export async function deleteDoc(path: string): Promise<void> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/${path}`, { method: "DELETE", headers });
  if (!res.ok && res.status !== 404) throw new Error(`DELETE ${path}: ${res.status}`);
}

/**
 * Atomic like toggle — batches the like-doc write and count increment
 * into a single Firestore commit. No read needed; server-side increment.
 * Falls back to separate writes if the commit API fails.
 */
export async function commitLikeToggle(
  articlePath: string,
  likePath: string,
  userId: string,
  like: boolean
): Promise<void> {
  const headers = await authHeaders();
  const articleName = `projects/${PID}/databases/(default)/documents/${articlePath}`;
  const likeName = `projects/${PID}/databases/(default)/documents/${likePath}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const writes: any[] = like
    ? [
        {
          update: {
            name: likeName,
            fields: { userId: { stringValue: userId } },
          },
        },
        {
          update: {
            name: articleName,
            fields: {},
          },
          updateMask: { fieldPaths: [] },
          updateTransforms: [
            { fieldPath: "likeCount", increment: { integerValue: "1" } },
          ],
        },
      ]
    : [
        { delete: likeName },
        {
          update: {
            name: articleName,
            fields: {},
          },
          updateMask: { fieldPaths: [] },
          updateTransforms: [
            { fieldPath: "likeCount", increment: { integerValue: "-1" } },
          ],
        },
      ];

  const res = await fetch(`${BASE}:commit`, {
    method: "POST",
    headers,
    body: JSON.stringify({ writes }),
  });

  if (res.ok) return;

  // Atomic commit failed — fall back to separate writes
  const body = await res.text();
  console.warn("Batch commit failed, using fallback:", res.status, body);
  await commitLikeToggleFallback(articlePath, likePath, userId, like, headers);
}

/** Fallback: separate writes when batch commit is unavailable */
async function commitLikeToggleFallback(
  articlePath: string,
  likePath: string,
  userId: string,
  like: boolean,
  headers: HeadersInit
): Promise<void> {
  if (like) {
    // Create like doc
    await fetch(`${BASE}/${likePath}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ fields: { userId: { stringValue: userId } } }),
    });
  } else {
    // Delete like doc
    await fetch(`${BASE}/${likePath}`, { method: "DELETE", headers });
  }

  // Read current count, then write updated count
  const articleRes = await fetch(`${BASE}/${articlePath}?key=${KEY}`);
  const currentCount = articleRes.ok
    ? (fromFields((await articleRes.json()).fields || {}).likeCount as number) || 0
    : 0;

  const newCount = like ? currentCount + 1 : Math.max(0, currentCount - 1);
  const mask = `updateMask.fieldPaths=likeCount`;
  await fetch(`${BASE}/${articlePath}?${mask}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({ fields: { likeCount: { integerValue: String(newCount) } } }),
  });
}

export async function addDoc(collectionPath: string, data: Record<string, unknown>): Promise<string> {
  const headers = await authHeaders();
  const res = await fetch(`${BASE}/${collectionPath}`, {
    method: "POST",
    headers,
    body: JSON.stringify({ fields: toFields(data) }),
  });
  if (!res.ok) throw new Error(`ADD ${collectionPath}: ${res.status} ${(await res.json()).error?.message || ""}`);
  const result = await res.json();
  return result.name.split("/").pop()!;
}
