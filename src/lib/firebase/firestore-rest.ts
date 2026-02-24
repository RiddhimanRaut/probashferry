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

export async function incrementField(docPath: string, field: string, amount: number): Promise<void> {
  const headers = await authHeaders();
  const docName = `projects/${PID}/databases/(default)/documents/${docPath}`;
  const res = await fetch(
    `https://firestore.googleapis.com/v1/projects/${PID}/databases/(default)/documents:commit`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        writes: [
          {
            transform: {
              document: docName,
              fieldTransforms: [
                { fieldPath: field, increment: { integerValue: String(amount) } },
              ],
            },
          },
        ],
      }),
    }
  );
  if (!res.ok) throw new Error(`INCREMENT ${docPath}.${field}: ${res.status}`);
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
