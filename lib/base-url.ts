import { headers } from "next/headers";

function withoutTrailingSlash(url: string) {
  return url.replace(/\/$/, "");
}

export async function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return withoutTrailingSlash(process.env.NEXT_PUBLIC_APP_URL);
  }

  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");

  if (host) {
    const proto = requestHeaders.get("x-forwarded-proto") ?? "http";
    return `${proto}://${host}`;
  }

  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  return "http://localhost:3000";
}
