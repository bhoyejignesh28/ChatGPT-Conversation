import { Handler } from "@netlify/functions";
import { z } from "zod";
import { getJSON, putBlob, setJSON, getBlobURL } from "../lib/blobs";
import { Template } from "../lib/types";
import { badRequest, handleOptions, requireAuth, okCors } from "./_shared/utils";

const schema = z.object({ image: z.string().min(10) });

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") return badRequest("Invalid method");
  try {
    await requireAuth(event, { requireRole: "admin" });
  } catch (err) {
    return err as any;
  }
  const id = extractId(event.queryStringParameters?.splat);
  if (!id) return badRequest("Missing template id");
  if (!event.body) return badRequest("Missing body");
  const parsed = schema.safeParse(JSON.parse(event.body));
  if (!parsed.success) return badRequest(parsed.error.message);
  const templatePath = `templates/${id}.json`;
  const template = await getJSON<Template>(templatePath);
  if (!template) return badRequest("Template not found");
  const buffer = decodeBase64(parsed.data.image);
  if (!buffer) return badRequest("Invalid image data");
  if (buffer.length > 5 * 1024 * 1024) return badRequest("File too large");
  await putBlob(template.baseImageUrl, buffer, "image/png");
  template.updatedAt = Date.now();
  await setJSON(templatePath, template);
  const signed = await getBlobURL(template.baseImageUrl);
  return okCors({ baseImageUrl: signed });
};

function extractId(splat?: string) {
  if (!splat) return null;
  return splat.split("/")[0];
}

function decodeBase64(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/png|image\/jpeg);base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[2], "base64");
}

export { handler };
