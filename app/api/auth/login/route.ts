import bcrypt from "bcrypt";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createAuthToken, readJsonBody, serializeUser } from "@/lib/auth";

export const runtime = "nodejs";

type LoginBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await readJsonBody(request)) as LoginBody | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return Response.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      passwordHash: users.passwordHash,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    return Response.json({ error: "Invalid credentials." }, { status: 401 });
  }

  const token = createAuthToken({ id: user.id, email: user.email });

  return Response.json({
    user: serializeUser(user),
    token,
    tokenType: "Bearer",
  });
}
