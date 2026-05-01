import { createHmac, timingSafeEqual } from "node:crypto";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";

const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7;

type JwtPayload = {
  sub: string;
  email: string;
  iat: number;
  exp: number;
};

type AuthUser = {
  id: number;
  email: string;
  createdAt: Date;
};

export function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return secret;
}

function base64UrlEncode(value: Buffer | string) {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = "=".repeat((4 - (normalized.length % 4)) % 4);

  return Buffer.from(normalized + padding, "base64");
}

export function createAuthToken(user: { id: number; email: string }) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const payload: JwtPayload = {
    sub: String(user.id),
    email: user.email,
    iat: issuedAt,
    exp: issuedAt + TOKEN_TTL_SECONDS,
  };

  const header = { alg: "HS256", typ: "JWT" };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", getJwtSecret())
    .update(unsignedToken)
    .digest();

  return `${unsignedToken}.${base64UrlEncode(signature)}`;
}

export function verifyAuthToken(token: string) {
  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !encodedSignature) {
    return null;
  }

  try {
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const expectedSignature = createHmac("sha256", getJwtSecret())
      .update(unsignedToken)
      .digest();
    const actualSignature = base64UrlDecode(encodedSignature);

    if (
      expectedSignature.length !== actualSignature.length ||
      !timingSafeEqual(expectedSignature, actualSignature)
    ) {
      return null;
    }

    const header = JSON.parse(base64UrlDecode(encodedHeader).toString("utf8"));
    if (header?.alg !== "HS256") {
      return null;
    }

    const payload = JSON.parse(
      base64UrlDecode(encodedPayload).toString("utf8")
    ) as JwtPayload;
    const now = Math.floor(Date.now() / 1000);

    if (!payload?.sub || !payload?.email || payload.exp <= now) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  return authorization.slice(7).trim();
}

export async function getAuthenticatedUser(request: Request) {
  const token = getBearerToken(request);

  if (!token) {
    return null;
  }

  const payload = verifyAuthToken(token);

  if (!payload) {
    return null;
  }

  const [user] = await db
    .select({ id: users.id, email: users.email, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.id, Number(payload.sub)))
    .limit(1);

  if (!user || user.email !== payload.email) {
    return null;
  }

  return user as AuthUser;
}

export function serializeUser(user: AuthUser) {
  return {
    id: user.id,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export function serializePost<T extends { createdAt: Date; updatedAt: Date; publishedAt: Date | null }>(
  post: T & Record<string, unknown>
) {
  return {
    ...post,
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
  };
}

export async function readJsonBody(request: Request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}
