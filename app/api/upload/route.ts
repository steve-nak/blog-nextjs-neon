import { getAuthenticatedUser } from "@/lib/auth";
import { deleteR2ObjectFromUrl, isR2PublicUrl } from "@/lib/r2";
import { uploadFileToR2 } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.formData();
  const file = body.get("file");

  if (!(file instanceof File)) {
    return Response.json({ error: "A file is required." }, { status: 400 });
  }

  if (!file.type.startsWith("image/")) {
    return Response.json({ error: "Only image files are allowed." }, { status: 400 });
  }

  const url = await uploadFileToR2(file);

  return Response.json({ url }, { status: 201 });
}

export async function DELETE(request: Request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const url = body?.url;

  if (typeof url !== "string" || !url || !isR2PublicUrl(url)) {
    return Response.json({ error: "A valid image URL is required." }, { status: 400 });
  }

  await deleteR2ObjectFromUrl(url).catch(() => undefined);

  return Response.json({ deleted: true });
}