import { Handler } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { randomUUID } from "crypto";
import { getJSON, list, setJSON, getBlobURL } from "../lib/blobs";
import { User } from "../lib/types";
import { handleOptions, badRequest, okCors, requireAuth } from "./_shared/utils";

const schema = z.object({
  email: z.string().email(),
  username: z.string().min(2),
  password: z.string().min(6),
  role: z.enum(["admin", "user"]).default("user")
});

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") return handleOptions();
  if (event.httpMethod !== "POST") return badRequest("Invalid method");
  try {
    await requireAuth(event, { requireRole: "admin" });
  } catch (err) {
    return err as any;
  }
  if (!event.body) return badRequest("Missing body");
  const parsed = schema.safeParse(JSON.parse(event.body));
  if (!parsed.success) return badRequest(parsed.error.message);
  const { email, username, password, role } = parsed.data;
  const existing = await findUserByEmail(email);
  if (existing) return badRequest("Email already used");
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
