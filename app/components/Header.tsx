"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "./AuthProvider";

const navItems = [
  { href: "/", label: "Posts" },
  { href: "/posts/new", label: "Write" },
  { href: "/profile", label: "Profile" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex flex-wrap items-center gap-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-950">
            Blog System
          </Link>
          <nav className="flex flex-wrap items-center gap-1 text-sm">
            {navItems.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-md px-3 py-2 font-medium transition ${
                    active
                      ? "bg-zinc-950 text-white"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-sm">
          {loading ? (
            <span className="text-zinc-500">Checking session...</span>
          ) : user ? (
            <>
              <span className="max-w-60 truncate text-zinc-600">{user.email}</span>
              <button
                type="button"
                onClick={() => {
                  logout();
                  router.push("/");
                }}
                className="rounded-md border border-zinc-300 px-3 py-2 font-medium text-zinc-700 transition hover:border-zinc-950 hover:text-zinc-950"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link className="rounded-md px-3 py-2 font-medium text-zinc-700 hover:bg-zinc-100" href="/login">
                Log in
              </Link>
              <Link className="rounded-md bg-teal-600 px-3 py-2 font-medium text-white hover:bg-teal-700" href="/register">
                Register
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
