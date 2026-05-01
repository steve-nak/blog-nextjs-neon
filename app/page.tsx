import { getBaseUrl } from "@/lib/base-url";

import { Pagination } from "./components/Pagination";
import { PostCard } from "./components/PostCard";
import { ErrorMessage } from "./components/StatusMessage";
import type { PostsResponse } from "./components/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function getPosts(page: number): Promise<{ data?: PostsResponse; error?: string }> {
  try {
    const response = await fetch(`${await getBaseUrl()}/api/posts?page=${page}&limit=6`, {
      cache: "no-store",
    });
    const data = await response.json();

    if (!response.ok) {
      return { error: data.error ?? "Posts could not be loaded." };
    }

    return { data };
  } catch {
    return { error: "Posts could not be loaded." };
  }
}

export default async function Home(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const pageValue = Array.isArray(searchParams.page) ? searchParams.page[0] : searchParams.page;
  const page = Math.max(Number(pageValue ?? "1") || 1, 1);
  const { data, error } = await getPosts(page);

  return (
    <div className="grid gap-8">
      <section className="grid gap-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Latest posts</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">Read from the community</h1>
            <p className="mt-3 max-w-2xl text-zinc-600">
              Browse short post previews, open the full article, or log in to publish your own.
            </p>
          </div>
        </div>
      </section>

      {error ? <ErrorMessage message={error} /> : null}

      {data?.items.length ? (
        <section className="grid gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {data.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
          <Pagination page={data.page} totalPages={data.totalPages} />
        </section>
      ) : !error ? (
        <div className="rounded-md border border-zinc-200 bg-white p-8 text-center text-zinc-500">
          No posts yet. Log in and publish the first one.
        </div>
      ) : null}
    </div>
  );
}
