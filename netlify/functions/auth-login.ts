import { Handler } from "@netlify/functions";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getBlobURL, getJSON, list } from "../lib/blobs";
import { User } from "../lib/types";
import { signToken } from "../lib/jwt";
import { badRequest, handleOptions, okCors } from "./_shared/utils";
import { createSessionCookie, withCookie } from "./_shared/cookies";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return handleOptions();
  }
  if (event.httpMethod !== "POST") {
    return badRequest("Invalid method");
  }
  if (!event.body) {
    return badRequest("Missing body");
  }
  const parsed = schema.safeParse(JSON.parse(event.body));
  if (!parsed.success) {
    return badRequest(parsed.error.message);
  }
  const { email, password } = parsed.data;
  const user = await findUserByEmail(email);
  if (!user) {
    return badRequest("Invalid credentials");
  }
  if (user.status === "inactive") {
    return badRequest("Account inactive");
  }
  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return badRequest("Invalid credentials");
  }
  const token = signToken({ uid: user.uid, role: user.role, status: user.status });
  const response = okCors({ user: await sanitize(user) });
  return withCookie(response, createSessionCookie(token));
};

async function findUserByEmail(email: string): Promise<User | null> {
  const entries = await list("users/");
  for (const entry of entries) {
    if (!entry.path.endsWith(".json")) continue;
    const user = await getJSON<User>(entry.path);
    if (user && user.email.toLowerCase() === email.toLowerCase()) {
      return user;
    }
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
