import { notFound } from "next/navigation";

import { getBaseUrl } from "@/lib/base-url";

import { PostForm } from "../../../components/PostForm";
import type { Post } from "../../../components/types";

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

export default async function EditPostPage(props: PageProps<"/posts/[id]/edit">) {
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
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Edit post</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">{post.title}</h1>
      </div>
      <PostForm mode="edit" post={post} />
    </div>
  );
}
