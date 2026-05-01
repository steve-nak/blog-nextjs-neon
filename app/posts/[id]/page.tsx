import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";

import { getBaseUrl } from "@/lib/base-url";

import { PostActions } from "../../components/PostActions";
import { SafeHtml } from "../../components/SafeHtml";
import type { Post } from "../../components/types";

async function getPost(id: number) {
  const response = await fetch(`${await getBaseUrl()}/api/posts/${id}`, {
    cache: "no-store",
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error("Post could not be loaded.");
  }

  const data = (await response.json()) as { post: Post };
  return data.post;
}

export default async function PostDetailPage(props: PageProps<"/posts/[id]">) {
  const { id } = await props.params;
  const postId = Number(id);

  if (!Number.isInteger(postId) || postId <= 0) {
    notFound();
  }

  const post = await getPost(postId);

  if (!post) {
    notFound();
  }

  return (
    <article className="grid gap-6">
      <Link href="/" className="text-sm font-medium text-teal-700 hover:text-teal-800">
        Back to posts
      </Link>

      <header className="grid gap-4 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
        {post.coverImageUrl ? (
          <Image src={post.coverImageUrl} alt={post.title} width={1600} height={900} className="h-72 w-full object-cover" />
        ) : null}
        <div className="grid gap-4 p-6">
        <div>
          <p className="text-sm text-zinc-500">
            By {post.authorEmail ?? "Unknown author"} · {new Date(post.createdAt).toLocaleDateString()}
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">{post.title}</h1>
        </div>

        {post.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        <PostActions postId={post.id} authorId={post.authorId} />
        </div>
      </header>

      <section className="rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <SafeHtml html={post.contentHtml} />
      </section>
    </article>
  );
}
