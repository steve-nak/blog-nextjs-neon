import bcrypt from "bcrypt";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { createAuthToken, readJsonBody, serializeUser } from "@/lib/auth";

export const runtime = "nodejs";

type RegisterBody = {
  email?: string;
  password?: string;
};

export async function POST(request: Request) {
  const body = (await readJsonBody(request)) as RegisterBody | null;
  const email = body?.email?.trim().toLowerCase();
  const password = body?.password;

  if (!email || !password) {
    return Response.json(
      { error: "Email and password are required." },
      { status: 400 }
    );
  }

  if (password.length < 6) {
    return Response.json(
      { error: "Password must be at least 6 characters long." },
      { status: 400 }
    );
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existingUser) {
    return Response.json(
      { error: "An account with that email already exists." },
      { status: 409 }
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [createdUser] = await db
    .insert(users)
    .values({ email, passwordHash })
    .returning({ id: users.id, email: users.email, createdAt: users.createdAt });

  const token = createAuthToken({ id: createdUser.id, email: createdUser.email });

  return Response.json(
    {
      user: serializeUser(createdUser),
      token,
      tokenType: "Bearer",
    },
    { status: 201 }
  );
}
