import { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";
import { z } from "zod";
import { del, getBlobURL, getJSON, list, putBlob, setJSON } from "../lib/blobs";
import { Render } from "../lib/types";
import { badRequest, handleOptions, okCors, requireAuth } from "./_shared/utils";

const renderSchema = z.object({
  templateId: z.string(),
  overrides: z.record(z.any()).default({}),
  image: z.string().min(10)
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
    const splat = event.queryStringParameters?.splat;
    if (splat) {
      const id = splat.split("/")[0];
      const render = await getJSON<Render>(`renders/${id}.json`);
      if (!render || render.userId !== auth.user.uid) return badRequest("Not found");
      const signed = render.exportUrl ? await getBlobURL(render.exportUrl) : null;
      return okCors({ render: { ...render, exportUrl: signed } });
    }
    const own = event.queryStringParameters?.mine === "1" || event.queryStringParameters?.mine === "true";
    const entries = await list("renders/");
    const renders: Render[] = [];
    for (const entry of entries) {
      if (!entry.path.endsWith(".json")) continue;
      const render = await getJSON<Render>(entry.path);
      if (!render) continue;
      if (own && render.userId !== auth.user.uid) continue;
      if (!own && render.userId !== auth.user.uid && auth.user.role !== "admin") continue;
      renders.push({ ...render, exportUrl: render.exportUrl ? await getBlobURL(render.exportUrl) : null });
    }
    return okCors({ renders });
  }

  if (event.httpMethod === "POST") {
    if (!event.body) return badRequest("Missing body");
    const parsed = renderSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return badRequest(parsed.error.message);
    const buffer = decodeBase64(parsed.data.image);
    if (!buffer) return badRequest("Invalid image");
    if (buffer.length > 5 * 1024 * 1024) return badRequest("File too large");
    const id = randomUUID();
    const path = `uploads/exports/${auth.user.uid}/${id}.png`;
    await putBlob(path, buffer, "image/png");
    const now = Date.now();
    const render: Render = {
      id,
      userId: auth.user.uid,
      templateId: parsed.data.templateId,
      overrides: parsed.data.overrides as Record<string, any>,
      exportUrl: path,
      createdAt: now,
      updatedAt: now
    };
    await setJSON(`renders/${id}.json`, render);
    return okCors({ render: { ...render, exportUrl: await getBlobURL(path) } }, { statusCode: 201 });
  }

  if (event.httpMethod === "DELETE") {
    if (auth.user.role !== "admin") return badRequest("Forbidden");
    const id = event.queryStringParameters?.id;
    if (!id) return badRequest("Missing id");
    const render = await getJSON<Render>(`renders/${id}.json`);
    if (!render) return badRequest("Not found");
    await del(`renders/${id}.json`);
    return okCors({ ok: true });
  }

  return badRequest("Unsupported method");
};

function decodeBase64(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/png);base64,(.+)$/);
  if (!match) return null;
  return Buffer.from(match[2], "base64");
}

export { handler };
