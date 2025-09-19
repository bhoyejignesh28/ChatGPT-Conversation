import { getStore } from '@netlify/blobs';

const dataStore = getStore({ name: 'filingscenter-data' });

export async function readJSON<T>(key: string): Promise<T | null> {
  const value = await dataStore.get(key, { type: 'json' });
  return (value as T) ?? null;
}

export async function writeJSON(key: string, value: any) {
  await dataStore.set(key, JSON.stringify(value), {
    contentType: 'application/json'
  });
}

export async function deleteBlob(key: string) {
  await dataStore.delete(key);
}

export async function listKeys(prefix: string): Promise<string[]> {
  const result = await dataStore.list({ prefix });
  return result.blobs.map((blob: any) => blob.key);
}

export async function getBlobBuffer(key: string): Promise<Buffer | null> {
  const value = await dataStore.get(key, { type: 'arrayBuffer' });
  if (!value) return null;
  return Buffer.from(value as ArrayBuffer);
}

export async function setBlob(key: string, data: Buffer, contentType: string) {
  await dataStore.set(key, data, { contentType });
}

export async function getSignedUrl(key: string, expiresInSeconds = 60 * 60 * 24 * 30) {
  if (!key) return null;
  try {
    return await dataStore.getSignedUrl({ key, expiresIn: expiresInSeconds });
  } catch (err) {
    console.warn('Signed URL failed', err);
    return null;
  }
}

