import type { HandlerEvent } from '@netlify/functions';
import jwt from 'jsonwebtoken';
import { getUserById } from './users.js';
import type { UserRecord, UserRole } from './types';
import { getClientIp } from './http.js';

const COOKIE_NAME = 'fc_session';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

interface TokenPayload {
  uid: string;
  role: UserRole;
}

const rateMap = new Map<string, { count: number; reset: number }>();

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET not configured');
  return secret;
}

export function createCookie(token: string) {
  const maxAge = TOKEN_TTL_SECONDS;
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Strict; Secure`;
}

export function clearCookie() {
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict; Secure`;
}

export async function createSession(user: UserRecord) {
  const secret = getSecret();
  return jwt.sign({ uid: user.id, role: user.role } as TokenPayload, secret, {
    expiresIn: TOKEN_TTL_SECONDS
  });
}

export async function getSession(event: HandlerEvent): Promise<UserRecord | null> {
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie);
  if (!cookies[COOKIE_NAME]) return null;
  try {
    const decoded = jwt.verify(cookies[COOKIE_NAME], getSecret()) as TokenPayload;
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

