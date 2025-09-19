import { Handler } from "@netlify/functions";
import { getBlobURL, getJSON } from "../lib/blobs";
import { User } from "../lib/types";
import { handleOptions, okCors, parseCookies, COOKIE_NAME } from "./_shared/utils";
import { verifyToken } from "../lib/jwt";

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  const cookies = parseCookies(event.headers.cookie || event.headers.Cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return okCors(null);
  try {
    const claims = verifyToken(token);
    const user = await getJSON<User>(`users/${claims.uid}.json`);
    if (!user || user.status === "inactive") return okCors(null);
    const { passwordHash, ...rest } = user;
    if (rest.profile.logoUrl) {
      rest.profile.logoUrl = await getBlobURL(rest.profile.logoUrl);
    }
    return okCors(rest);
  } catch (err) {
    return okCors(null);
  }
};

export { handler };
