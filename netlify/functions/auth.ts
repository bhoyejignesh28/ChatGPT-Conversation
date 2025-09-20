import type { Handler } from '@netlify/functions';
import { z } from 'zod';
import { jsonResponse, errorResponse, parseJSONBody, getPathSegments } from './_lib/http';
import {
  createSession,
  createCookie,
  clearCookie,
  getSession,
  enforceRole,
  checkRateLimit
} from './_lib/auth';
import {
  createUser,
  getUserByEmailOrUsername,
  verifyPassword,
  countAdmins
} from './_lib/users';

const credentialsSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3),
  password: z.string().min(6)
});

const loginSchema = z.object({
  identity: z.string().min(2),
  password: z.string().min(6)
});

const handler: Handler = async (event) => {
  const method = event.httpMethod.toUpperCase();
  const [action] = getPathSegments(event);

  if (method === 'POST' && action === 'seed-admin') {
    if (!checkRateLimit(event, 'seed-admin', 3, 60 * 60 * 1000)) {
      return errorResponse(429, 'Too many seed attempts.');
    }
    const payload = parseJSONBody(event);
    const parsed = credentialsSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const admins = await countAdmins();
    if (admins > 0) return errorResponse(400, 'Admin already exists.');
    const user = await createUser({ ...parsed.data, role: 'admin', status: 'active' });
    const token = await createSession(user);
    return jsonResponse(200, { user: toSafeUser(user) }, { 'Set-Cookie': createCookie(token) });
  }

  if (method === 'POST' && action === 'register') {
    const current = await getSession(event);
    if (!enforceRole(current, ['admin'])) return errorResponse(403, 'Forbidden');
    const payload = parseJSONBody(event);
    const parsed = credentialsSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const user = await createUser({ ...parsed.data, role: 'user', status: 'active' });
    return jsonResponse(200, { user: toSafeUser(user) });
  }

  if (method === 'POST' && action === 'login') {
    if (!checkRateLimit(event, 'login', 5, 60 * 1000)) {
      return errorResponse(429, 'Too many attempts, slow down.');
    }
    const payload = parseJSONBody(event);
    const parsed = loginSchema.safeParse(payload);
    if (!parsed.success) return errorResponse(400, 'Invalid payload.');
    const user = await getUserByEmailOrUsername(parsed.data.identity);
    if (!user) return errorResponse(401, 'Invalid credentials.');
    if (user.status !== 'active') return errorResponse(403, 'Account inactive.');
    const ok = await verifyPassword(user, parsed.data.password);
    if (!ok) return errorResponse(401, 'Invalid credentials.');
    const token = await createSession(user);
    return jsonResponse(200, { user: toSafeUser(user) }, { 'Set-Cookie': createCookie(token) });
  }

  if (method === 'POST' && action === 'logout') {
    return jsonResponse(200, { success: true }, { 'Set-Cookie': clearCookie() });
  }

  if (method === 'GET' && action === 'me') {
    const user = await getSession(event);
    if (!user) return errorResponse(401, 'Unauthorized');
    return jsonResponse(200, { user: toSafeUser(user), profile: user.profile });
  }

  return errorResponse(404, 'Not found');
};

function toSafeUser(user: any) {
  const { passwordHash, ...rest } = user;
  return rest;
}

export { handler as default };

