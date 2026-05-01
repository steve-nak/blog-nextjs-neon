import Link from "next/link";
import Image from "next/image";

import type { Post } from "./types";

function excerptFromHtml(html: string) {
  const text = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 180 ? `${text.slice(0, 180)}...` : text;
}

export function PostCard({ post }: { post: Post }) {
  return (
    <article className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm">
      {post.coverImageUrl ? (
        <Image src={post.coverImageUrl} alt={post.title} width={1200} height={675} className="h-48 w-full object-cover" />
      ) : null}
      <div className="flex flex-col gap-3 p-5">
        <div>
          <Link href={`/posts/${post.id}`} className="text-xl font-semibold tracking-tight text-zinc-950 hover:text-teal-700">
            {post.title}
          </Link>
          <p className="mt-1 text-sm text-zinc-500">
            By {post.authorEmail ?? "Unknown author"} · {new Date(post.createdAt).toLocaleDateString()}
          </p>
        </div>
        <p className="text-sm leading-6 text-zinc-600">{excerptFromHtml(post.contentHtml)}</p>
        {post.tags?.length ? (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-600">
                {tag}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </article>
  );
}
