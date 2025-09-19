import { Handler } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { z } from "zod";
import { getBlobURL, getJSON, list, setJSON, del } from "../lib/blobs";
import { User } from "../lib/types";
import { badRequest, handleOptions, okCors, requireAuth } from "./_shared/utils";

const createSchema = z.object({
  email: z.string().email(),
  username: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["admin", "user"]).default("user")
});

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  try {
    await requireAuth(event, { requireRole: "admin" });
  } catch (err) {
    return err as any;
  }

  if (event.httpMethod === "GET") {
    const entries = await list("users/");
    const users: any[] = [];
    for (const entry of entries) {
      if (!entry.path.endsWith(".json")) continue;
      const user = await getJSON<User>(entry.path);
      if (user) users.push(await sanitize(user));
    }
    return okCors({ users });
  }

  if (event.httpMethod === "POST") {
    if (!event.body) return badRequest("Missing body");
    const parsed = createSchema.safeParse(JSON.parse(event.body));
    if (!parsed.success) return badRequest(parsed.error.message);
    const { email, username, password, role } = parsed.data;
    const existing = await findUserByEmail(email);
    if (existing) return badRequest("Email exists");
    const now = Date.now();
    const uid = randomUUID();
    const passwordHash = await bcrypt.hash(password, 10);
    const user: User = {
      uid,
      email,
      username,
      role,
      status: "active",
      profile: { name: username, phone: "", email, address: "", logoUrl: null },
      passwordHash,
      createdAt: now,
      updatedAt: now
    };
    await setJSON(`users/${uid}.json`, user);
    return okCors({ user: await sanitize(user) }, { statusCode: 201 });
  }

  if (event.httpMethod === "DELETE") {
    const uid = event.queryStringParameters?.uid;
    if (!uid) return badRequest("Missing uid");
    const path = `users/${uid}.json`;
    const user = await getJSON<User>(path);
    if (!user) return badRequest("User not found");
    await del(path);
    return okCors({ ok: true });
  }

  return badRequest("Unsupported method");
};

async function findUserByEmail(email: string) {
  const entries = await list("users/");
  for (const entry of entries) {
    if (!entry.path.endsWith(".json")) continue;
    const user = await getJSON<User>(entry.path);
    if (user && user.email.toLowerCase() === email.toLowerCase()) return user;
  }
  return null;
}

async function sanitize(user: User) {
  const { passwordHash, ...rest } = user;
  if (rest.profile.logoUrl) {
    rest.profile.logoUrl = await getBlobURL(rest.profile.logoUrl);
  }
  return rest;
}

export { handler };
