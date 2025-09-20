import type { HandlerEvent } from '@netlify/functions';
import { randomBytes } from 'node:crypto';
import jwt from 'jsonwebtoken';
import { getUserById } from './users';
import type { UserRecord, UserRole } from './types';
import { getClientIp } from './http';
import { readJSON, writeJSON } from './store';

const COOKIE_NAME = 'fc_session';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;
const SECRET_BLOB_KEY = 'config/auth-secret.json';

interface TokenPayload {
  uid: string;
  role: UserRole;
}

const rateMap = new Map<string, { count: number; reset: number }>();

let cachedSecret: string | null = process.env.JWT_SECRET ?? null;
let secretPromise: Promise<string> | null = null;

async function loadPersistedSecret(): Promise<string> {
  const stored = await readJSON<{ secret?: string }>(SECRET_BLOB_KEY);
  if (stored?.secret) {
    return stored.secret;
  }
  const generated = randomBytes(48).toString('hex');
  await writeJSON(SECRET_BLOB_KEY, {
    secret: generated,
    createdAt: new Date().toISOString()
  });
  return generated;
}

async function getSecret(): Promise<string> {
  if (process.env.JWT_SECRET) {
    cachedSecret = process.env.JWT_SECRET;
    return cachedSecret;
  }
  if (cachedSecret) return cachedSecret;
  if (!secretPromise) {
    secretPromise = loadPersistedSecret()
      .then((value) => {
        cachedSecret = value;
        return value;
      })
      .catch((err) => {
        secretPromise = null;
        throw err;
      });
  }
  return secretPromise;
}

export function createCookie(token: string) {
  const maxAge = TOKEN_TTL_SECONDS;
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict; Secure`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure`;
}

export async function createSession(user: UserRecord) {
  const secret = await getSecret();
  return jwt.sign({ uid: user.id, role: user.role } as TokenPayload, secret, {
    expiresIn: TOKEN_TTL_SECONDS
  }) as string;
}

export async function getSession(event: HandlerEvent): Promise<UserRecord | null> {
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie);
  if (!cookies[COOKIE_NAME]) return null;
  try {
    const secret = await getSecret();
    const decoded = jwt.verify(cookies[COOKIE_NAME], secret) as TokenPayload;
    const user = await getUserById(decoded.uid);
    if (!user) return null;
    return user;
  } catch (err) {
    return null;
  }
}

export function parseCookies(header?: string) {
  const result: Record<string, string> = {};
  if (!header) return result;
  const parts = header.split(';');
  for (const part of parts) {
    const [key, ...rest] = part.trim().split('=');
    if (!key) continue;
    result[key] = decodeURIComponent(rest.join('='));
  }
  return result;
}

export function enforceRole(user: UserRecord | null, roles: UserRole[]) {
  if (!user) return false;
  if (!roles.length) return true;
  return roles.includes(user.role);
}

export function checkRateLimit(event: HandlerEvent, key: string, limit = 10, windowMs = 60 * 1000) {
  const ip = getClientIp(event);
  const mapKey = `${key}:${ip}`;
  const entry = rateMap.get(mapKey);
  const now = Date.now();
  if (!entry || entry.reset < now) {
    rateMap.set(mapKey, { count: 1, reset: now + windowMs });
    return true;
  }
  entry.count += 1;
  if (entry.count > limit) {
    return false;
  }
  return true;
}

