import { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";
import { z } from "zod";
import { del, getJSON, list, setJSON } from "../lib/blobs";
import { Category } from "../lib/types";
import { badRequest, handleOptions, okCors, requireAuth } from "./_shared/utils";

const createSchema = z.object({ name: z.string().min(2) });
const updateSchema = z.object({ name: z.string().min(2) });

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  try {
    await requireAuth(event, { requireRole: "admin" });
  } catch (err) {
    return err as any;
  }

  if (event.httpMethod === "GET") {
    const entries = await list("categories/");
    const categories: Category[] = [];
    for (const entry of entries) {
      if (!entry.path.endsWith(".json")) continue;
      const category = await getJSON<Category>(entry.path);
      if (category) categories.push(category);
    }
    return okCors({ categories });
  }

  if (event.httpMethod === "POST") {
    if (!event.body) return badRequest("Missing body");
    const parsed = createSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return badRequest(parsed.error.message);
    const now = Date.now();
    const id = randomUUID();
    const category: Category = { id, name: parsed.data.name, createdAt: now, updatedAt: now };
    await setJSON(`categories/${id}.json`, category);
    return okCors({ category }, { statusCode: 201 });
  }

  if (event.httpMethod === "PATCH") {
    const id = event.queryStringParameters?.id;
    if (!id) return badRequest("Missing id");
    if (!event.body) return badRequest("Missing body");
    const parsed = updateSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return badRequest(parsed.error.message);
    const path = `categories/${id}.json`;
    const category = await getJSON<Category>(path);
    if (!category) return badRequest("Not found");
    category.name = parsed.data.name;
    category.updatedAt = Date.now();
    await setJSON(path, category);
    return okCors({ category });
  }

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    if (!id) return badRequest("Missing id");
    await del(`categories/${id}.json`);
    return okCors({ ok: true });
  }

  return badRequest("Unsupported method");
};

export { handler };
