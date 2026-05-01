import Link from "next/link";

export default function PostNotFound() {
  return (
    <div className="rounded-md border border-zinc-200 bg-white p-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Post not found</h1>
      <p className="mt-2 text-zinc-600">That post may have been deleted or the link may be wrong.</p>
      <Link href="/" className="mt-4 inline-flex rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
        Back to posts
      </Link>
    </div>
  );
}
