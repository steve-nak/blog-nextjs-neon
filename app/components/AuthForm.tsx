"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "./AuthProvider";
import { ErrorMessage } from "./StatusMessage";

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Authentication failed.");
      }

      setSession(data.token, data.user);
      router.push(mode === "register" ? "/profile" : "/");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Authentication failed.");
    } finally {
      setPending(false);
    }
  }

  const isRegister = mode === "register";

  return (
    <form onSubmit={handleSubmit} className="mx-auto grid w-full max-w-md gap-5 rounded-md border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-950">
          {isRegister ? "Create an account" : "Log in"}
        </h1>
        <p className="mt-2 text-sm text-zinc-500">
          {isRegister ? "Start publishing posts with your own author account." : "Welcome back. Continue writing and managing your posts."}
        </p>
      </div>

      {error ? <ErrorMessage message={error} /> : null}

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Email
        <input
          required
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Password
        <input
          required
          minLength={6}
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-md border border-zinc-300 px-3 py-2 text-zinc-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
        />
      </label>

      <button
        disabled={pending}
        className="rounded-md bg-zinc-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
      >
        {pending ? "Please wait..." : isRegister ? "Register" : "Log in"}
      </button>

      <p className="text-sm text-zinc-500">
        {isRegister ? "Already have an account? " : "Need an account? "}
        <Link href={isRegister ? "/login" : "/register"} className="font-medium text-teal-700 hover:text-teal-800">
          {isRegister ? "Log in" : "Register"}
        </Link>
      </p>
    </form>
  );
}
