import Link from "next/link";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Link
        href={`/?page=${Math.max(page - 1, 1)}`}
        aria-disabled={page <= 1}
        className={`rounded-md border px-4 py-2 text-sm font-medium ${
          page <= 1
            ? "pointer-events-none border-zinc-200 text-zinc-300"
            : "border-zinc-300 text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"
        }`}
      >
        Previous
      </Link>
      <span className="text-sm text-zinc-500">
        Page {page} of {totalPages}
      </span>
      <Link
        href={`/?page=${Math.min(page + 1, totalPages)}`}
        aria-disabled={page >= totalPages}
        className={`rounded-md border px-4 py-2 text-sm font-medium ${
          page >= totalPages
            ? "pointer-events-none border-zinc-200 text-zinc-300"
            : "border-zinc-300 text-zinc-700 hover:border-zinc-950 hover:text-zinc-950"
        }`}
      >
        Next
      </Link>
    </div>
  );
}
