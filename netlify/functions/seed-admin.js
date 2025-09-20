import bcrypt from "bcryptjs";
import { withCORS } from "./_lib/cors.js";
import { json, bodyJSON } from "./_lib/http.js";
import { getDb } from "./_lib/db.js";

export const handler = withCORS(async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  const { email, username, password } = bodyJSON(event);
  if (!email || !username || !password) {
    return json(400, { error: "email, username, password required" });
  }

  const db = await getDb();
  const existingAdmin = await db.collection("users").findOne({ role: "admin" });
  if (existingAdmin) {
    return json(409, { error: "Admin already exists" });
  }

  const hash = await bcrypt.hash(password, 10);
  await db.collection("users").insertOne({
    email,
    username,
    hash,
    role: "admin",
    status: "active",
    createdAt: new Date()
  });

  return json(201, { ok: true, message: "Admin created" });
});
