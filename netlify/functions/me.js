import jwt from "jsonwebtoken";
import { withCORS } from "./_lib/cors.js";
import { json } from "./_lib/http.js";

export const handler = withCORS(async (event) => {
  const authHeader = event.headers?.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return json(401, { error: "No token" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return json(200, { ok: true, user: payload });
  } catch (error) {
    console.error("JWT verification failed", error);
    return json(401, { error: "Invalid token" });
  }
});
