"use client";

import Link from "next/link";

import { useAuth } from "../components/AuthProvider";
import { ErrorMessage, LoadingBlock } from "../components/StatusMessage";

export default function ProfilePage() {
  const { user, loading, authError } = useAuth();

  if (loading) {
    return <LoadingBlock label="Loading your profile..." />;
  }

  if (!user) {
    return (
      <div className="grid gap-4 rounded-md border border-zinc-200 bg-white p-6">
        {authError ? <ErrorMessage message={authError} /> : null}
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">Profile</h1>
          <p className="mt-2 text-zinc-600">Log in to view your account details.</p>
        </div>
        <Link href="/login" className="w-fit rounded-md bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800">
          Log in
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Your account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Profile</h1>
      </div>
      <section className="grid gap-4 rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-medium text-zinc-500">Email</p>
          <p className="mt-1 text-lg font-semibold text-zinc-950">{user.email}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-zinc-500">Account created</p>
          <p className="mt-1 text-zinc-700">{new Date(user.createdAt).toLocaleString()}</p>
        </div>
        <Link href="/posts/new" className="w-fit rounded-md bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700">
          Write a post
        </Link>
      </section>
    </div>
  );
}
