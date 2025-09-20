import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { withCORS } from "./_lib/cors.js";
import { json, bodyJSON } from "./_lib/http.js";
import { getDb } from "./_lib/db.js";

const TOKEN_TTL = "7d";

export const handler = withCORS(async (event) => {
  if (event.httpMethod !== "POST") {
    return json(405, { error: "Method Not Allowed" });
  }

  const { email, password } = bodyJSON(event);
  if (!email || !password) {
    return json(400, { error: "email, password required" });
  }

  const db = await getDb();
  const user = await db.collection("users").findOne({ email });
  if (!user) {
    return json(401, { error: "Invalid credentials" });
  }

  const passwordOk = await bcrypt.compare(password, user.hash);
  if (!passwordOk) {
    return json(401, { error: "Invalid credentials" });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    return json(500, { error: "JWT_SECRET missing" });
  }

  const token = jwt.sign(
    { sub: user._id.toString(), role: user.role, email: user.email, username: user.username },
    secret,
    { expiresIn: TOKEN_TTL }
  );

  return json(200, {
    token,
    user: { email: user.email, role: user.role, username: user.username }
  });
});
