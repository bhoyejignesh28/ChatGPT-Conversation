import type { Handler } from '@netlify/functions';
import { z } from 'zod';
import { jsonResponse, errorResponse, parseJSONBody, getPathSegments } from './_lib/http.js';
import { getSession, enforceRole } from './_lib/auth.js';
import { listCategories, createCategory, updateCategory, deleteCategoryRecord } from './_lib/collections.js';

const createSchema = z.object({ name: z.string().min(2) });

const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const segments = getPathSegments(event);
  const current = await getSession(event);

  if (method === 'GET' && segments.length === 0) {
    const categories = await listCategories();
    return jsonResponse(200, categories);
  }

  if (method === 'POST' && segments.length === 0) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const payload = parseJSONBody(event);
    const parsed = createSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const record = await createCategory(parsed.data.name);
    return jsonResponse(200, record);
  }

  if (method === 'PATCH' && segments.length === 1) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const payload = parseJSONBody(event);
    const parsed = createSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const record = await updateCategory(segments[0], { name: parsed.data.name });
    if (!record) return errorResponse(404, 'Not found');
    return jsonResponse(200, record);
  }

  if (method === 'DELETE' && segments.length === 1) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    await deleteCategoryRecord(segments[0]);
    return jsonResponse(200, { success: true });
  }

  return errorResponse(404, 'Not found');
};

export { handler as default };

