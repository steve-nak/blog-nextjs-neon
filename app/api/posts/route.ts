import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { getAuthenticatedUser, readJsonBody, serializePost } from "@/lib/auth";
import { isR2PublicUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type CreatePostBody = {
  title?: string;
  contentHtml?: string;
  coverImageUrl?: string | null;
  tags?: string[];
  publishedAt?: string | null;
};

function parsePaging(request: Request) {
  const url = new URL(request.url);
  const page = Math.max(Number(url.searchParams.get("page") ?? "1") || 1, 1);
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? "10") || 10, 1),
    50
  );

  return { page, limit, offset: (page - 1) * limit };
}

function validateTags(tags: unknown) {
  return Array.isArray(tags) && tags.every((tag) => typeof tag === "string");
}

export async function GET(request: Request) {
  const { page, limit, offset } = parsePaging(request);

  const [{ total: rawTotal }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(posts);
  const total = Number(rawTotal);

  const items = await db
    .select({
      id: posts.id,
      authorId: posts.authorId,
      authorEmail: users.email,
      title: posts.title,
      contentHtml: posts.contentHtml,
      coverImageUrl: posts.coverImageUrl,
      tags: posts.tags,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
    })
    .from(posts)
    .leftJoin(users, eq(posts.authorId, users.id))
    .orderBy(desc(posts.createdAt))
    .limit(limit)
    .offset(offset);

  return Response.json({
    items: items.map((post) => serializePost(post)),
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
  });
}

export async function POST(request: Request) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const body = (await readJsonBody(request)) as CreatePostBody | null;
  const title = body?.title?.trim();
  const contentHtml = body?.contentHtml?.trim();
  const coverImageUrl = body?.coverImageUrl?.trim() ?? null;
  const tags = body?.tags;
  const publishedAt = body?.publishedAt ? new Date(body.publishedAt) : null;

  if (!title || !contentHtml) {
    return Response.json(
      { error: "Title and contentHtml are required." },
      { status: 400 }
    );
  }

  if (tags !== undefined && !validateTags(tags)) {
    return Response.json(
      { error: "Tags must be an array of strings." },
      { status: 400 }
    );
  }

  if (publishedAt && Number.isNaN(publishedAt.getTime())) {
    return Response.json(
      { error: "publishedAt must be a valid date string." },
      { status: 400 }
    );
  }

  if (coverImageUrl && !isR2PublicUrl(coverImageUrl)) {
    return Response.json(
      { error: "coverImageUrl must come from the image upload service." },
      { status: 400 }
    );
  }

  const [createdPost] = await db
    .insert(posts)
    .values({
      authorId: user.id,
      title,
      contentHtml,
      coverImageUrl,
      tags: tags ?? null,
      publishedAt,
    })
    .returning();

  return Response.json({ post: serializePost(createdPost) }, { status: 201 });
}
