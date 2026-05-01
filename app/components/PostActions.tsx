"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "./AuthProvider";
import { ErrorMessage } from "./StatusMessage";

export function PostActions({ postId, authorId }: { postId: number; authorId: number }) {
  const router = useRouter();
  const { user, token, loading } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canManage = Boolean(!loading && user && user.id === authorId);

  if (!canManage) {
    return null;
  }

  async function deletePost() {
    if (!token || !confirm("Delete this post?")) {
      return;
    }

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "The post could not be deleted.");
      }

      router.push("/");
      router.refresh();
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "The post could not be deleted.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="grid gap-3">
      {error ? <ErrorMessage message={error} /> : null}
      <div className="flex flex-wrap gap-3">
        <Link href={`/posts/${postId}/edit`} className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-950 hover:text-zinc-950">
          Edit
        </Link>
        <button
          type="button"
          disabled={pending}
          onClick={deletePost}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
        >
          {pending ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
