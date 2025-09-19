import { Handler } from "@netlify/functions";
import { handleOptions, okCors } from "./_shared/utils";
import { clearSessionCookie, withCookie } from "./_shared/cookies";

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") return okCors({ ok: true });
  const response = okCors({ ok: true });
  return withCookie(response, clearSessionCookie());
};

export { handler };
