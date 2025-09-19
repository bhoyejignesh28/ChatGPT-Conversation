import jwt from "jsonwebtoken";
import { Role, UserStatus } from "@/lib/types";

const JWT_SECRET = process.env.JWT_SECRET || "development_secret";

export interface SessionClaims {
  uid: string;
  role: Role;
  status: UserStatus;
}

export function signToken(claims: SessionClaims, expiresIn = "7d") {
  return jwt.sign(claims, JWT_SECRET, { algorithm: "HS256", expiresIn });
}

export function verifyToken(token: string): SessionClaims {
  return jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }) as SessionClaims;
}
