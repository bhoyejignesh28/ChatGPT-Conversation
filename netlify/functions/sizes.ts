import type { Handler } from '@netlify/functions';
import { z } from 'zod';
import { jsonResponse, errorResponse, parseJSONBody, getPathSegments } from './_lib/http';
import { getSession, enforceRole } from './_lib/auth';
import { listSizes, createSize, updateSizeRecord, deleteSizeRecord } from './_lib/collections';

const sizeSchema = z.object({
  name: z.string().min(2),
  w: z.number().min(50),
  h: z.number().min(50)
});

const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const segments = getPathSegments(event);
  const current = await getSession(event);

  if (method === 'GET' && segments.length === 0) {
    const sizes = await listSizes();
    return jsonResponse(200, sizes);
  }

  if (method === 'POST' && segments.length === 0) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const payload = parseJSONBody(event);
    const parsed = sizeSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const record = await createSize(parsed.data);
    return jsonResponse(200, record);
  }

  if (method === 'PATCH' && segments.length === 1) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const payload = parseJSONBody(event);
    const parsed = sizeSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const record = await updateSizeRecord(segments[0], parsed.data);
    if (!record) return errorResponse(404, 'Not found');
    return jsonResponse(200, record);
  }

  if (method === 'DELETE' && segments.length === 1) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    await deleteSizeRecord(segments[0]);
    return jsonResponse(200, { success: true });
  }

  return errorResponse(404, 'Not found');
};

export { handler as default };

