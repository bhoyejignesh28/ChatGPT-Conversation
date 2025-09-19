import { Handler } from "@netlify/functions";
import { z } from "zod";
import { getBlobURL, setJSON } from "../lib/blobs";
import { badRequest, handleOptions, okCors, requireAuth } from "./_shared/utils";

const profileSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional()
});

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  let auth;
  try {
    auth = await requireAuth(event, { requireRole: "any" });
  } catch (err) {
    return err as any;
  }

  if (event.httpMethod === "GET") {
    return okCors({ profile: await toResponseProfile(auth.user.profile) });
  }

  if (event.httpMethod === "PATCH") {
    if (!event.body) return badRequest("Missing body");
    const parsed = profileSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return badRequest(parsed.error.message);
    auth.user.profile = { ...auth.user.profile, ...parsed.data };
    auth.user.updatedAt = Date.now();
    await setJSON(`users/${auth.user.uid}.json`, auth.user);
    return okCors({ profile: await toResponseProfile(auth.user.profile) });
  }

  return badRequest("Unsupported method");
};

async function toResponseProfile(profile: { logoUrl: string | null; [key: string]: any }) {
  if (profile.logoUrl) {
    return { ...profile, logoUrl: await getBlobURL(profile.logoUrl) };
  }
  return profile;
}

export { handler };
