import type { Handler } from '@netlify/functions';
import { z } from 'zod';
import { jsonResponse, errorResponse, parseJSONBody, getPathSegments } from './_lib/http';
import { getSession, enforceRole } from './_lib/auth';
import { listUsers, updateUser, deleteUser, updateUserProfile } from './_lib/users';

const statusSchema = z.object({ status: z.enum(['active', 'inactive']) });
const renameSchema = z.object({ username: z.string().min(3) });
const profileSchema = z
  .object({
    name: z.string().max(120).optional(),
    phone: z.string().max(120).optional(),
    email: z.string().email().optional(),
    address: z.string().max(200).optional(),
    custom: z.string().max(240).optional(),
    logoUrl: z.string().url().optional()
  })
  .partial();

const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const segments = getPathSegments(event);
  const current = await getSession(event);

  if (method === 'GET' && segments.length === 0) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const users = await listUsers();
    return jsonResponse(200, { users: users.map(toSafe) });
  }

  if (method === 'PATCH' && segments.length === 2 && segments[1] === 'status') {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const payload = parseJSONBody(event);
    const parsed = statusSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const user = await updateUser(segments[0], { status: parsed.data.status });
    if (!user) return errorResponse(404, 'Not found');
    return jsonResponse(200, { user: toSafe(user) });
  }

  if (method === 'PATCH' && segments.length === 2 && segments[1] === 'rename') {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const payload = parseJSONBody(event);
    const parsed = renameSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const user = await updateUser(segments[0], { username: parsed.data.username });
    if (!user) return errorResponse(404, 'Not found');
    return jsonResponse(200, { user: toSafe(user) });
  }

  if (method === 'DELETE' && segments.length === 1) {
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    await deleteUser(segments[0]);
    return jsonResponse(200, { success: true });
  }

  if (method === 'PATCH' && segments[0] === 'me' && segments[1] === 'profile') {
    if (!current) return errorResponse(401, 'Unauthorized');
    const payload = parseJSONBody(event);
    const parsed = profileSchema.safeParse(payload || {});
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const user = await updateUserProfile(current.id, parsed.data);
    if (!user) return errorResponse(404, 'Not found');
    return jsonResponse(200, { profile: user.profile });
  }

  return errorResponse(404, 'Not found');
};

function toSafe(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export { handler as default };

