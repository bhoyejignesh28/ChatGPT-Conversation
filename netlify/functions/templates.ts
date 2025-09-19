import type { Handler } from '@netlify/functions';
import { z } from 'zod';
import {
  jsonResponse,
  errorResponse,
  parseJSONBody,
  getPathSegments
} from './_lib/http.js';
import { getSession, enforceRole } from './_lib/auth.js';
import {
  listTemplates,
  createTemplate,
  updateTemplateRecord,
  getTemplate,
  deleteTemplateRecord
} from './_lib/collections.js';
import { parseMultipart } from './_lib/multipart.js';
import { setBlob, getSignedUrl } from './_lib/store.js';

const createSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string().min(1),
  sizeId: z.string().min(1)
});

const placeholderSchema = z.object({
  id: z.string(),
  type: z.enum(['text', 'logo']),
  key: z.enum(['name', 'phone', 'email', 'address', 'custom', 'logo']),
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
  fontGroup: z.enum(['sans', 'serif', 'script']).optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700), z.literal(800), z.literal(900)]).optional(),
  italic: z.boolean().optional(),
  fontSize: z.number().optional(),
  color: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  scale: z.number().optional()
});

const updateSchema = z.object({ placeholders: z.array(placeholderSchema) });

const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const segments = getPathSegments(event);
  const current = await getSession(event);

  if (method === 'GET' && segments.length === 0) {
    const templates = await listTemplates();
    return jsonResponse(200, templates);
  }

  if (method === 'POST' && segments.length === 0) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const payload = parseJSONBody(event);
    const parsed = createSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const record = await createTemplate({ ...parsed.data, ownerAdminUid: current!.id });
    return jsonResponse(200, record);
  }

  if (method === 'POST' && segments.length === 2 && segments[1] === 'base') {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const templateId = segments[0];
    const template = await getTemplate(templateId);
    if (!template) return errorResponse(404, 'Not found');
    const { files } = await parseMultipart(event);
    const file = files.find((f) => f.fieldname === 'file');
    if (!file) return errorResponse(400, 'File missing.');
    if (!['image/png', 'image/jpeg'].includes(file.mimetype)) {
      return errorResponse(400, 'Unsupported file type.');
    }
    if (file.data.length > 5 * 1024 * 1024) {
      return errorResponse(400, 'File too large (max 5MB).');
    }
    const key = `uploads/templates/${templateId}/base`;
    await setBlob(key, file.data, file.mimetype);
    const url = await getSignedUrl(key);
    const updated = await updateTemplateRecord(templateId, { baseImageKey: key, baseImageUrl: url ?? undefined });
    return jsonResponse(200, updated);
  }

  if (method === 'PATCH' && segments.length === 1) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const payload = parseJSONBody(event);
    const parsed = updateSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const updated = await updateTemplateRecord(segments[0], {
      placeholders: parsed.data.placeholders
    });
    if (!updated) return errorResponse(404, 'Not found');
    return jsonResponse(200, updated);
  }

  if (method === 'DELETE' && segments.length === 1) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    await deleteTemplateRecord(segments[0]);
    return jsonResponse(200, { success: true });
  }

  return errorResponse(404, 'Not found');
};

export { handler as default };

