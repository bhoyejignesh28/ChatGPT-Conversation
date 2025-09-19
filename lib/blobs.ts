import { createClient } from "@netlify/blobs";

const client = createClient();

export async function getJSON<T>(path: string): Promise<T | null> {
  const { body } = await client.get(path, { type: "json" });
  if (!body) return null;
  return (await body.json()) as T;
}

export async function setJSON<T>(path: string, data: T) {
  await client.set(path, JSON.stringify(data), {
    contentType: "application/json",
    consistency: "strong"
  });
}

export async function list(prefix: string) {
  const { blobs } = await client.list({ prefix, include: ["path"] });
  return blobs;
}

export async function del(path: string) {
  await client.delete(path);
}

export async function putBlob(path: string, data: ArrayBuffer | Uint8Array | Buffer, contentType: string) {
  await client.set(path, data, {
    contentType,
    consistency: "strong"
  });
}

export async function getBlobURL(path: string) {
  const { url } = await client.getSignedUrl({ path, expiresIn: 60 * 60 * 24 * 7 });
  return url;
}
