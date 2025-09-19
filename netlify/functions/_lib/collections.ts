import { nanoid } from 'nanoid';
import { readJSON, writeJSON, listKeys, deleteBlob, getSignedUrl } from './store.js';
import type { CategoryRecord, SizeRecord, TemplateRecord, RenderRecord } from './types';

const CATEGORY_PREFIX = 'categories/';
const SIZE_PREFIX = 'sizes/';
const TEMPLATE_PREFIX = 'templates/';
const RENDER_PREFIX = 'renders/';

export async function listCategories(): Promise<CategoryRecord[]> {
  const keys = await listKeys(CATEGORY_PREFIX);
  const results: CategoryRecord[] = [];
  for (const key of keys) {
    const item = await readJSON<CategoryRecord>(key);
    if (item) results.push(item);
  }
  return results;
}

export async function createCategory(name: string) {
  const now = new Date().toISOString();
  const record: CategoryRecord = {
    id: nanoid(),
    name,
    createdAt: now,
    updatedAt: now
  };
  await writeJSON(`${CATEGORY_PREFIX}${record.id}.json`, record);
  return record;
}

export async function updateCategory(id: string, updates: Partial<CategoryRecord>) {
  const record = await readJSON<CategoryRecord>(`${CATEGORY_PREFIX}${id}.json`);
  if (!record) return null;
  const next = { ...record, ...updates, updatedAt: new Date().toISOString() };
  await writeJSON(`${CATEGORY_PREFIX}${id}.json`, next);
  return next;
}

export async function deleteCategoryRecord(id: string) {
  await deleteBlob(`${CATEGORY_PREFIX}${id}.json`);
}

export async function listSizes(): Promise<SizeRecord[]> {
  const keys = await listKeys(SIZE_PREFIX);
  const results: SizeRecord[] = [];
  for (const key of keys) {
    const item = await readJSON<SizeRecord>(key);
    if (item) results.push(item);
  }
  return results;
}

export async function createSize(payload: { name: string; w: number; h: number }) {
  const now = new Date().toISOString();
  const record: SizeRecord = { id: nanoid(), createdAt: now, updatedAt: now, ...payload };
  await writeJSON(`${SIZE_PREFIX}${record.id}.json`, record);
  return record;
}

export async function updateSizeRecord(id: string, updates: Partial<SizeRecord>) {
  const record = await readJSON<SizeRecord>(`${SIZE_PREFIX}${id}.json`);
  if (!record) return null;
  const next = { ...record, ...updates, updatedAt: new Date().toISOString() };
  await writeJSON(`${SIZE_PREFIX}${id}.json`, next);
  return next;
}

export async function deleteSizeRecord(id: string) {
  await deleteBlob(`${SIZE_PREFIX}${id}.json`);
}

export async function listTemplates(): Promise<TemplateRecord[]> {
  const keys = await listKeys(TEMPLATE_PREFIX);
  const results: TemplateRecord[] = [];
  for (const key of keys) {
    const item = await readJSON<TemplateRecord>(key);
    if (item) {
      if (item.baseImageKey && !item.baseImageUrl) {
        const url = await getSignedUrl(item.baseImageKey);
        if (url) item.baseImageUrl = url;
      }
      results.push(item);
    }
  }
  return results;
}

export async function getTemplate(id: string) {
  const record = await readJSON<TemplateRecord>(`${TEMPLATE_PREFIX}${id}.json`);
  if (record && record.baseImageKey && !record.baseImageUrl) {
    const url = await getSignedUrl(record.baseImageKey);
    if (url) record.baseImageUrl = url;
  }
  return record;
}

export async function createTemplate(payload: {
  name: string;
  categoryId: string;
  sizeId: string;
  ownerAdminUid: string;
}): Promise<TemplateRecord> {
  const now = new Date().toISOString();
  const record: TemplateRecord = {
    id: nanoid(),
    name: payload.name,
    categoryId: payload.categoryId,
    sizeId: payload.sizeId,
    ownerAdminUid: payload.ownerAdminUid,
    placeholders: [],
    createdAt: now,
    updatedAt: now
  };
  await writeJSON(`${TEMPLATE_PREFIX}${record.id}.json`, record);
  return record;
}

export async function updateTemplateRecord(id: string, updates: Partial<TemplateRecord>) {
  const record = await readJSON<TemplateRecord>(`${TEMPLATE_PREFIX}${id}.json`);
  if (!record) return null;
  const next: TemplateRecord = {
    ...record,
    ...updates,
    placeholders: updates.placeholders ?? record.placeholders,
    baseImageKey: updates.baseImageKey ?? record.baseImageKey,
    baseImageUrl: updates.baseImageUrl ?? record.baseImageUrl,
    updatedAt: new Date().toISOString()
  };
  await writeJSON(`${TEMPLATE_PREFIX}${id}.json`, next);
  return next;
}

export async function deleteTemplateRecord(id: string) {
  await deleteBlob(`${TEMPLATE_PREFIX}${id}.json`);
}

export async function listRendersByUser(userId: string): Promise<RenderRecord[]> {
  const keys = await listKeys(RENDER_PREFIX);
  const results: RenderRecord[] = [];
  for (const key of keys) {
    const render = await readJSON<RenderRecord>(key);
    if (render && render.userId === userId) results.push(render);
  }
  return results;
}

export async function getRender(id: string) {
  return readJSON<RenderRecord>(`${RENDER_PREFIX}${id}.json`);
}

export async function saveRender(record: RenderRecord) {
  await writeJSON(`${RENDER_PREFIX}${record.id}.json`, record);
}

