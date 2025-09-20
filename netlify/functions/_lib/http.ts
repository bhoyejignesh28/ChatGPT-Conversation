import type { HandlerEvent } from '@netlify/functions';

export function jsonResponse(statusCode: number, data: any, extraHeaders: Record<string, string> = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      ...extraHeaders
    },
    body: JSON.stringify(data)
  };
}

export function errorResponse(statusCode: number, error: string) {
  return jsonResponse(statusCode, { error });
}

export function parseJSONBody<T>(event: HandlerEvent): T | null {
  if (!event.body) return null;
  try {
    return JSON.parse(event.body) as T;
  } catch (err) {
    return null;
  }
}

export function getPathSegments(event: HandlerEvent): string[] {
  const path = event.path || '';
  const cleaned = path.replace(/^\/\.netlify\/functions\//, '');
  const parts = cleaned.split('/').filter(Boolean);
  return parts.slice(1);
}

export function getClientIp(event: HandlerEvent): string {
  return (
    event.headers['client-ip'] ||
    event.headers['x-forwarded-for'] ||
    event.headers['x-real-ip'] ||
    'unknown'
  );
}

