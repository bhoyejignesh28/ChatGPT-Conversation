import { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";
import { z } from "zod";
import { del, getJSON, list, setJSON } from "../lib/blobs";
import { Size } from "../lib/types";
import { badRequest, handleOptions, okCors, requireAuth } from "./_shared/utils";

const createSchema = z.object({
  name: z.string().min(2),
  w: z.number().positive(),
  h: z.number().positive()
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  w: z.number().positive().optional(),
  h: z.number().positive().optional()
});

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  try {
    await requireAuth(event, { requireRole: "admin" });
  } catch (err) {
    return err as any;
  }

  if (event.httpMethod === "GET") {
    const entries = await list("sizes/");
    const sizes: Size[] = [];
    for (const entry of entries) {
      if (!entry.path.endsWith(".json")) continue;
      const size = await getJSON<Size>(entry.path);
      if (size) sizes.push(size);
    }
    return okCors({ sizes });
  }

  if (event.httpMethod === "POST") {
    if (!event.body) return badRequest("Missing body");
    const parsed = createSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return badRequest(parsed.error.message);
    const now = Date.now();
    const id = randomUUID();
    const size: Size = { id, ...parsed.data, createdAt: now, updatedAt: now };
    await setJSON(`sizes/${id}.json`, size);
    return okCors({ size }, { statusCode: 201 });
  }

  if (event.httpMethod === "PATCH") {
    const id = event.queryStringParameters?.id;
    if (!id) return badRequest("Missing id");
    if (!event.body) return badRequest("Missing body");
    const parsed = updateSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return badRequest(parsed.error.message);
    const path = `sizes/${id}.json`;
    const size = await getJSON<Size>(path);
    if (!size) return badRequest("Not found");
    Object.assign(size, parsed.data);
    size.updatedAt = Date.now();
    await setJSON(path, size);
    return okCors({ size });
  }

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    if (!id) return badRequest("Missing id");
    await del(`sizes/${id}.json`);
    return okCors({ ok: true });
  }

  return badRequest("Unsupported method");
};

export { handler };
