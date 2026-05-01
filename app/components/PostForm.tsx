"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { type ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { useAuth } from "./AuthProvider";
import { ErrorMessage } from "./StatusMessage";
import type { Post } from "./types";

type PostFormProps = {
  post?: Post;
  mode: "create" | "edit";
};

export function PostForm({ post, mode }: PostFormProps) {
  const router = useRouter();
  const { token, loading } = useAuth();
  const [title, setTitle] = useState(post?.title ?? "");
  const [contentHtml, setContentHtml] = useState(post?.contentHtml ?? "");
  const [tagsText, setTagsText] = useState(post?.tags?.join(", ") ?? "");
  const [coverImageUrl, setCoverImageUrl] = useState(post?.coverImageUrl ?? null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(post?.coverImageUrl ?? null);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objectUrlRef = useRef<string | null>(null);

  const tags = useMemo(
    () =>
      tagsText
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    [tagsText]
  );

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, []);

  function handleCoverImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
    }

    const previewUrl = URL.createObjectURL(file);
    objectUrlRef.current = previewUrl;

    setCoverImageFile(file);
    setCoverImageUrl(null);
    setCoverImagePreview(previewUrl);
  }

  function removeCoverImage() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }

    setCoverImageFile(null);
    setCoverImageUrl(null);
    setCoverImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function uploadCoverImage() {
    if (!coverImageFile || !token) {
      return coverImageUrl;
    }

    const formData = new FormData();
    formData.append("file", coverImageFile);

    const response = await fetch("/api/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error ?? "The cover image could not be uploaded.");
    }

    return data.url as string;
  }

  async function deleteUploadedCoverImage(url: string | null) {
    if (!url || !token) {
      return;
    }

    await fetch("/api/upload", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url }),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("Please log in before publishing.");
      return;
    }

    setPending(true);
    setError(null);

    try {
      const uploadedCoverImageUrl = await uploadCoverImage();
      const endpoint = mode === "create" ? "/api/posts" : `/api/posts/${post?.id}`;
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          contentHtml,
          coverImageUrl: uploadedCoverImageUrl,
          tags,
          publishedAt: post?.publishedAt ?? new Date().toISOString(),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        if (coverImageFile) {
          await deleteUploadedCoverImage(uploadedCoverImageUrl ?? null);
        }

        throw new Error(data.error ?? "The post could not be saved.");
      }

      router.push(`/posts/${data.post.id}`);
      router.refresh();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The post could not be saved.");
    } finally {
      setPending(false);
    }
  }

  if (!loading && !token) {
    return <ErrorMessage message="You need to log in before you can write posts." />;
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      {error ? <ErrorMessage message={error} /> : null}

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Title
        <input
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Content HTML
        <textarea
          required
          rows={12}
          value={contentHtml}
          onChange={(event) => setContentHtml(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <div className="grid gap-3 text-sm font-medium text-zinc-700">
        <div className="flex items-center justify-between gap-3">
          <span>Cover image</span>
          {coverImagePreview ? (
            <button
              type="button"
              onClick={removeCoverImage}
              className="text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Remove
            </button>
          ) : null}
        </div>

        {coverImagePreview ? (
          <div className="overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            <img src={coverImagePreview} alt="Cover image preview" className="h-56 w-full object-cover" />
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-sm font-normal text-zinc-500">
            Add a cover image to give the post a stronger preview.
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverImageChange}
          className="block w-full cursor-pointer rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-teal-600 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-teal-700"
        />
      </div>

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Tags
        <input
          value={tagsText}
          onChange={(event) => setTagsText(event.target.value)}
          placeholder="nextjs, neon, api"
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <button
        disabled={pending || loading}
        className="w-fit rounded-md bg-teal-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? "Saving..." : mode === "create" ? "Publish post" : "Save changes"}
      </button>
    </form>
  );
}
