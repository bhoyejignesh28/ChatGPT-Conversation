import { Handler } from "@netlify/functions";
import { z } from "zod";
import { getBlobURL, putBlob, setJSON } from "../lib/blobs";
import { User } from "../lib/types";
import { badRequest, handleOptions, okCors, requireAuth } from "./_shared/utils";

const schema = z.object({ image: z.string().min(10) });

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") return badRequest("Invalid method");
  let auth;
  try {
    auth = await requireAuth(event, { requireRole: "any" });
  } catch (err) {
    return err as any;
  }
  if (!event.body) return badRequest("Missing body");
  const parsed = schema.safeParse(JSON.parse(event.body));
  if (!parsed.success) return badRequest(parsed.error.message);
  const buffer = decodeBase64(parsed.data.image);
  if (!buffer) return badRequest("Invalid image data");
  if (buffer.length > 5 * 1024 * 1024) return badRequest("File too large");
  const path = `uploads/logos/${auth.user.uid}`;
  await putBlob(path, buffer, "image/png");
  auth.user.profile.logoUrl = path;
  auth.user.updatedAt = Date.now();
  await setJSON(`users/${auth.user.uid}.json`, auth.user);
  const signed = await getBlobURL(path);
  return okCors({ logoUrl: signed });
};

function decodeBase64(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[2], "base64");
}

export { handler };
