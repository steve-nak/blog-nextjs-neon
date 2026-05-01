import { getAuthenticatedUser, serializeUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  return Response.json({ user: serializeUser(user) });
}
