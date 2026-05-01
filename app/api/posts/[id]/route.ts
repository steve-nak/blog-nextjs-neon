import { eq } from "drizzle-orm";

import { db } from "@/db";
import { posts, users } from "@/db/schema";
import { getAuthenticatedUser, readJsonBody, serializePost } from "@/lib/auth";
import { deleteR2ObjectFromUrl, isR2PublicUrl } from "@/lib/r2";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type PostRouteContext = {
  params: Promise<{ id: string }>;
};

type UpdatePostBody = {
  title?: string;
  contentHtml?: string;
  coverImageUrl?: string | null;
  tags?: string[];
  publishedAt?: string | null;
};

function validateTags(tags: unknown) {
  return Array.isArray(tags) && tags.every((tag) => typeof tag === "string");
}

async function getPostById(postId: number) {
  const [post] = await db
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
    .where(eq(posts.id, postId))
    .limit(1);

  return post ?? null;
}

export async function GET(_: Request, { params }: PostRouteContext) {
  const { id } = await params;
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId <= 0) {
    return Response.json({ error: "Invalid post id." }, { status: 400 });
  }

  const post = await getPostById(postId);

  if (!post) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  return Response.json({ post: serializePost(post) });
}

export async function PATCH(request: Request, { params }: PostRouteContext) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId <= 0) {
    return Response.json({ error: "Invalid post id." }, { status: 400 });
  }

  const existingPost = await getPostById(postId);

  if (!existingPost) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  if (existingPost.authorId !== user.id) {
    return Response.json({ error: "You do not own this post." }, { status: 403 });
  }

  const body = (await readJsonBody(request)) as UpdatePostBody | null;
  const updates: Partial<typeof posts.$inferInsert> = {};

  if (body?.title !== undefined) {
    const title = body.title.trim();

    if (!title) {
      return Response.json({ error: "Title cannot be empty." }, { status: 400 });
    }

    updates.title = title;
  }

  if (body?.contentHtml !== undefined) {
    const contentHtml = body.contentHtml.trim();

    if (!contentHtml) {
      return Response.json(
        { error: "contentHtml cannot be empty." },
        { status: 400 }
      );
    }

    updates.contentHtml = contentHtml;
  }

  if (body?.coverImageUrl !== undefined) {
    if (body.coverImageUrl !== null) {
      const coverImageUrl = body.coverImageUrl.trim();

      if (!coverImageUrl || !isR2PublicUrl(coverImageUrl)) {
        return Response.json(
          { error: "coverImageUrl must come from the image upload service." },
          { status: 400 }
        );
      }

      updates.coverImageUrl = coverImageUrl;
    } else {
      updates.coverImageUrl = null;
    }
  }

  if (body?.tags !== undefined) {
    if (!validateTags(body.tags)) {
      return Response.json(
        { error: "Tags must be an array of strings." },
        { status: 400 }
      );
    }

    updates.tags = body.tags;
  }

  if (body?.publishedAt !== undefined) {
    if (body.publishedAt === null) {
      updates.publishedAt = null;
    } else {
      const publishedAt = new Date(body.publishedAt);

      if (Number.isNaN(publishedAt.getTime())) {
        return Response.json(
          { error: "publishedAt must be a valid date string." },
          { status: 400 }
        );
      }

      updates.publishedAt = publishedAt;
    }
  }

  if (Object.keys(updates).length === 0) {
    return Response.json(
      { error: "Provide at least one field to update." },
      { status: 400 }
    );
  }

  const [updatedPost] = await db
    .update(posts)
    .set({
      ...updates,
      updatedAt: new Date(),
    })
    .where(eq(posts.id, postId))
    .returning();

  if (
    existingPost.coverImageUrl &&
    existingPost.coverImageUrl !== updatedPost.coverImageUrl
  ) {
    await deleteR2ObjectFromUrl(existingPost.coverImageUrl).catch(() => undefined);
  }

  return Response.json({ post: serializePost(updatedPost) });
}

export async function DELETE(request: Request, { params }: PostRouteContext) {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return Response.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { id } = await params;
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId <= 0) {
    return Response.json({ error: "Invalid post id." }, { status: 400 });
  }

  const existingPost = await getPostById(postId);

  if (!existingPost) {
    return Response.json({ error: "Post not found." }, { status: 404 });
  }

  if (existingPost.authorId !== user.id) {
    return Response.json({ error: "You do not own this post." }, { status: 403 });
  }

  await db.delete(posts).where(eq(posts.id, postId));

  if (existingPost.coverImageUrl) {
    await deleteR2ObjectFromUrl(existingPost.coverImageUrl).catch(() => undefined);
  }

  return Response.json({ deleted: true });
}
