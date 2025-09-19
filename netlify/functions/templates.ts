import { Handler } from "@netlify/functions";
import { randomUUID } from "crypto";
import { z } from "zod";
import { del, getJSON, list, setJSON, getBlobURL } from "../lib/blobs";
import { Placeholder, Template } from "../lib/types";
import { badRequest, handleOptions, okCors, requireAuth } from "./_shared/utils";

const placeholderSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "logo", "icon"]),
  key: z.enum(["name", "phone", "email", "address", "custom", "logo", "icon:phone", "icon:email", "icon:address"]),
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  fontGroup: z.enum(["sans", "serif", "script"]).optional(),
  fontFamily: z.string().optional(),
  fontWeight: z.union([z.literal(400), z.literal(500), z.literal(600), z.literal(700), z.literal(800), z.literal(900)]).optional(),
  italic: z.boolean().optional(),
  fontSize: z.number().positive().optional(),
  color: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional()
});

const createSchema = z.object({
  name: z.string().min(2),
  categoryId: z.string(),
  sizeId: z.string()
});

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  placeholders: z.array(placeholderSchema).optional()
});

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  let auth;
  try {
    auth = await requireAuth(event, { requireRole: "admin" });
  } catch (err) {
    if (event.httpMethod === "GET") {
      // allow read access for users
    } else {
      return err as any;
    }
  }

  if (event.httpMethod === "GET") {
    const id = event.queryStringParameters?.id;
    if (id) {
      const template = await getJSON<Template>(`templates/${id}.json`);
      if (!template) return badRequest("Template not found");
      return okCors({ template: await attachBaseUrl(template) });
    }
    const entries = await list("templates/");
    const templates: Template[] = [];
    for (const entry of entries) {
      if (!entry.path.endsWith(".json")) continue;
      const template = await getJSON<Template>(entry.path);
      if (template) {
        templates.push(await attachBaseUrl(template));
      }
    }
    return okCors({ templates });
  }

  if (!auth) {
    return badRequest("Unauthorized");
  }

  if (event.httpMethod === "POST") {
    if (!event.body) return badRequest("Missing body");
    const parsed = createSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return badRequest(parsed.error.message);
    const now = Date.now();
    const id = randomUUID();
    const template: Template = {
      id,
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      sizeId: parsed.data.sizeId,
      baseImageUrl: `uploads/templates/${id}/base`,
      ownerAdminUid: auth.user.uid,
      placeholders: [],
      createdAt: now,
      updatedAt: now
    };
    await setJSON(`templates/${id}.json`, template);
    return okCors({ template: await attachBaseUrl(template) }, { statusCode: 201 });
  }

  if (event.httpMethod === "PATCH") {
    const id = event.queryStringParameters?.id;
    if (!id) return badRequest("Missing id");
    if (!event.body) return badRequest("Missing body");
    const parsed = updateSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return badRequest(parsed.error.message);
    const path = `templates/${id}.json`;
    const template = await getJSON<Template>(path);
    if (!template) return badRequest("Template not found");
    if (parsed.data.name) template.name = parsed.data.name;
    if (parsed.data.placeholders) template.placeholders = parsed.data.placeholders as Placeholder[];
    template.updatedAt = Date.now();
    await setJSON(path, template);
    return okCors({ template: await attachBaseUrl(template) });
  }

  if (event.httpMethod === "DELETE") {
    const id = event.queryStringParameters?.id;
    if (!id) return badRequest("Missing id");
    await del(`templates/${id}.json`);
    return okCors({ ok: true });
  }

  return badRequest("Unsupported method");
};

async function attachBaseUrl(template: Template): Promise<Template> {
  const url = await getBlobURL(template.baseImageUrl);
  return { ...template, baseImageUrl: url };
}

export { handler };
