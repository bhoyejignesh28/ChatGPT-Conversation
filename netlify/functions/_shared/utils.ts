import { HandlerResponse, HandlerEvent } from "@netlify/functions";
import { verifyToken, SessionClaims } from "../../lib/jwt";
import { getJSON, setJSON } from "../../lib/blobs";
import { User } from "../../lib/types";

interface WithAuth {
  claims: SessionClaims;
  user: User;
}

export interface HandlerOptions {
  requireRole?: "admin" | "user" | "any";
}

export const COOKIE_NAME = "fc_session";

export function parseCookies(cookieHeader?: string | null) {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [key, ...rest] = pair.trim().split("=");
    cookies[key] = decodeURIComponent(rest.join("="));
  }
  return cookies;
}

export async function requireAuth(event: HandlerEvent, options: HandlerOptions = {}): Promise<WithAuth> {
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) {
    throw unauthorized();
  }
  let claims: SessionClaims;
  try {
    claims = verifyToken(token);
  } catch (err) {
    throw unauthorized();
  }
  const user = await getJSON<User>(`users/${claims.uid}.json`);
  if (!user) {
    throw unauthorized();
  }
  if (user.status === "inactive") {
    throw forbidden("Account inactive");
  }
  if (options.requireRole && options.requireRole !== "any" && user.role !== options.requireRole) {
    throw forbidden("Insufficient role");
  }
  return { claims, user };
}

export function unauthorized(message = "Unauthorized"): HandlerResponse {
  return {
    statusCode: 401,
    headers: jsonHeaders(),
    body: JSON.stringify({ error: message })
  };
}

export function forbidden(message = "Forbidden"): HandlerResponse {
  return {
    statusCode: 403,
    headers: jsonHeaders(),
    body: JSON.stringify({ error: message })
  };
}

export function json(data: unknown, init: Partial<HandlerResponse> = {}): HandlerResponse {
  return {
    statusCode: init.statusCode ?? 200,
    headers: { ...jsonHeaders(), ...(init.headers || {}) },
    body: typeof data === "string" ? data : JSON.stringify(data)
  };
}

export function jsonHeaders(additional?: Record<string, string>) {
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": process.env.SITE_URL || "http://localhost:8888",
    "Access-Control-Allow-Credentials": "true",
    ...(additional ?? {})
  };
}

export function methodNotAllowed(): HandlerResponse {
  return {
    statusCode: 405,
    headers: jsonHeaders(),
    body: "Method Not Allowed"
  };
}

export function noContent(): HandlerResponse {
  return {
    statusCode: 204,
    headers: jsonHeaders(),
    body: ""
  };
}

export function withCors(response: HandlerResponse): HandlerResponse {
  return {
    ...response,
    headers: {
      ...response.headers,
      "Access-Control-Allow-Origin": process.env.SITE_URL || "http://localhost:8888",
      "Access-Control-Allow-Credentials": "true"
    }
  };
}

export function okCors(data: unknown, init: Partial<HandlerResponse> = {}): HandlerResponse {
  return withCors(json(data, init));
}

export function handleOptions(): HandlerResponse {
  return {
    statusCode: 204,
    headers: {
      "Access-Control-Allow-Origin": process.env.SITE_URL || "http://localhost:8888",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS"
    },
    body: ""
  };
}

export function badRequest(message: string): HandlerResponse {
  return {
    statusCode: 400,
    headers: jsonHeaders(),
    body: JSON.stringify({ error: message })
  };
}

export function notFound(message = "Not Found"): HandlerResponse {
  return {
    statusCode: 404,
    headers: jsonHeaders(),
    body: JSON.stringify({ error: message })
  };
}

export async function saveUser(user: User) {
  await setJSON(`users/${user.uid}.json`, user);
}
