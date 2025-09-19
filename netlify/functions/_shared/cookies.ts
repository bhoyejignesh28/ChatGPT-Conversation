import { HandlerResponse } from "@netlify/functions";
import { COOKIE_NAME, jsonHeaders } from "./utils";

export function createSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "Secure;" : "";
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; HttpOnly; ${secure} SameSite=Lax; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`;
}

export function withCookie(response: HandlerResponse, cookie: string): HandlerResponse {
  return {
    ...response,
    headers: {
      ...jsonHeaders(),
      ...(response.headers || {}),
      "Set-Cookie": cookie
    }
  };
}
