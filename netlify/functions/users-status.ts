import { Handler } from "@netlify/functions";
import { z } from "zod";
import { getBlobURL, getJSON, setJSON } from "../lib/blobs";
import { User } from "../lib/types";
import { badRequest, handleOptions, okCors, requireAuth } from "./_shared/utils";

const schema = z.object({ status: z.enum(["active", "inactive"]) });

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "PATCH") return badRequest("Invalid method");
  try {
    await requireAuth(event, { requireRole: "admin" });
  } catch (err) {
    return err as any;
  }
  const uid = extractUid(event.queryStringParameters?.splat);
  if (!uid) return badRequest("Invalid uid");
  if (!event.body) return badRequest("Missing body");
  const parsed = schema.safeParse(JSON.parse(event.body));
  if (!parsed.success) return badRequest(parsed.error.message);
  const path = `users/${uid}.json`;
  const user = await getJSON<User>(path);
  if (!user) return badRequest("User not found");
  user.status = parsed.data.status;
  user.updatedAt = Date.now();
  await setJSON(path, user);
  return okCors({ user: await sanitize(user) });
};

function extractUid(splat?: string) {
  if (!splat) return null;
  return splat.split("/")[0];
}

async function sanitize(user: User) {
  const { passwordHash, ...rest } = user;
  if (rest.profile.logoUrl) {
    rest.profile.logoUrl = await getBlobURL(rest.profile.logoUrl);
  }
  return rest;
}

export { handler };
