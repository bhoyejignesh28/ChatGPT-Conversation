import type { Handler } from '@netlify/functions';
import { z } from 'zod';
import { jsonResponse, errorResponse, parseJSONBody, getPathSegments } from './_lib/http.js';
import { getSession } from './_lib/auth.js';
import { listRendersByUser, getRender, saveRender } from './_lib/collections.js';
import { nanoid } from 'nanoid';
import { setBlob, getSignedUrl } from './_lib/store.js';

const renderSchema = z.object({
  templateId: z.string(),
  overrides: z.record(z.any()),
  width: z.number(),
  height: z.number(),
  imageBase64: z.string()
});

const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const segments = getPathSegments(event);
  const current = await getSession(event);
  if (!current) return errorResponse(401, 'Unauthorized');

  if (method === 'GET' && segments.length === 0) {
    if (event.queryStringParameters?.mine === '1') {
      const renders = await listRendersByUser(current.id);
      return jsonResponse(200, renders);
    }
    return errorResponse(400, 'Unsupported query.');
  }

  if (method === 'GET' && segments.length === 1) {
    const render = await getRender(segments[0]);
    if (!render || render.userId !== current.id) return errorResponse(404, 'Not found');
    return jsonResponse(200, render);
  }

  if (method === 'POST' && segments.length === 0) {
    const payload = parseJSONBody(event);
    const parsed = renderSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const id = nanoid();
    const buffer = Buffer.from(parsed.data.imageBase64, 'base64');
    const key = `uploads/exports/${current.id}/${id}.png`;
    await setBlob(key, buffer, 'image/png');
    const url = await getSignedUrl(key, 60 * 60 * 24 * 30);
    const record = {
      id,
      userId: current.id,
      templateId: parsed.data.templateId,
      overrides: parsed.data.overrides,
      width: parsed.data.width,
      height: parsed.data.height,
      exportUrl: url ?? '',
      createdAt: new Date().toISOString()
    };
    await saveRender(record);
    return jsonResponse(200, record);
  }

  return errorResponse(404, 'Not found');
};

export { handler as default };

