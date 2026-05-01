import { execSync, spawn, type ChildProcess } from "node:child_process";
import net from "node:net";

import bcrypt from "bcrypt";
import postgres from "postgres";

const hasTestDatabaseUrl = Boolean(process.env.TEST_DATABASE_URL);
const describeIntegration = hasTestDatabaseUrl ? describe : describe.skip;

type Json = Record<string, any>;

let server: ChildProcess | null = null;
let serverOutput = "";
let stoppingServer = false;
let baseUrl = "";
let sql: postgres.Sql | null = null;

const ownerEmail = "owner.integration@example.com";
const otherEmail = "other.integration@example.com";
const password = "secret123";

async function getFreePort() {
  return new Promise<number>((resolve, reject) => {
    const listener = net.createServer();
    listener.once("error", reject);
    listener.listen(0, () => {
      const address = listener.address();
      listener.close(() => {
        if (address && typeof address === "object") {
          resolve(address.port);
        } else {
          reject(new Error("Could not allocate a test server port."));
        }
      });
    });
  });
}

async function waitForServer(url: string) {
  const deadline = Date.now() + 60_000;
  let lastError: unknown;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${url}/api/posts`);
      if (response.ok) {
        return;
      }
    } catch (error) {
      lastError = error;
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(
    `Next test server did not become ready: ${String(lastError)}\n${serverOutput}`
  );
}

async function resetDatabase() {
  if (!sql) {
    throw new Error("Test database is not connected.");
  }

  await sql`truncate table posts, users restart identity cascade`;

  const passwordHash = await bcrypt.hash(password, 10);
  await sql`
    insert into users (email, password_hash)
    values (${ownerEmail}, ${passwordHash}), (${otherEmail}, ${passwordHash})
  `;
}

async function api(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);

  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }

  const response = await fetch(`${baseUrl}${path}`, { ...init, headers });
  const text = await response.text();
  const body = text ? (JSON.parse(text) as Json) : {};

  return { response, body };
}

async function login(email = ownerEmail) {
  const { response, body } = await api("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  expect(response.status).toBe(200);
  expect(body.token).toEqual(expect.any(String));

  return body.token as string;
}

function auth(token: string) {
  return { authorization: `Bearer ${token}` };
}

function stopServer() {
  if (!server?.pid || server.killed) {
    return;
  }

  stoppingServer = true;
  if (process.platform === "win32") {
    execSync(`taskkill /pid ${server.pid} /t /f`, { stdio: "ignore" });
  } else {
    server.kill("SIGTERM");
  }
}

describeIntegration("Blog System API integration", () => {
  beforeAll(async () => {
    if (!process.env.TEST_DATABASE_URL) {
      throw new Error("TEST_DATABASE_URL is required for integration tests.");
    }

    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.JWT_SECRET = process.env.JWT_SECRET ?? "test-jwt-secret";
    process.env.R2_PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "https://cdn.example.com";

    execSync("npm run db:migrate", {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
      },
      stdio: "inherit",
    });

    execSync("npm run build", {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
      },
      stdio: "inherit",
    });

    sql = postgres(process.env.TEST_DATABASE_URL, { max: 1 });
    await resetDatabase();

    const port = await getFreePort();
    baseUrl = `http://127.0.0.1:${port}`;
    serverOutput = "";
    server = spawn(`npm run start -- -p ${port}`, {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: process.env.TEST_DATABASE_URL,
        JWT_SECRET: process.env.JWT_SECRET,
        R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
      },
      shell: true,
      stdio: "pipe",
    });

    server.stdout?.on("data", (chunk) => {
      serverOutput += chunk.toString();
    });
    server.stderr?.on("data", (chunk) => {
      serverOutput += chunk.toString();
    });

    server.on("exit", (code) => {
      if (!stoppingServer && code && code !== 0) {
        process.stderr.write(`Next test server exited with code ${code}\n`);
      }
    });

    await waitForServer(baseUrl);
  }, 90_000);

  beforeEach(async () => {
    await resetDatabase();
  });

  afterAll(async () => {
    stopServer();

    if (sql) {
      await sql.end();
    }
  });

  it("registers, rejects duplicate registration, logs in, and returns the current user", async () => {
    const email = "new.integration@example.com";

    const registered = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: ` ${email.toUpperCase()} `, password }),
    });

    expect(registered.response.status).toBe(201);
    expect(registered.body).toMatchObject({
      user: { email },
      tokenType: "Bearer",
    });
    expect(registered.body.token).toEqual(expect.any(String));
    expect(registered.body.user.passwordHash).toBeUndefined();

    const duplicate = await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    expect(duplicate.response.status).toBe(409);

    const loggedIn = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });

    expect(loggedIn.response.status).toBe(200);
    expect(loggedIn.body.user.email).toBe(email);

    const me = await api("/api/auth/me", {
      headers: auth(loggedIn.body.token),
    });

    expect(me.response.status).toBe(200);
    expect(me.body.user).toMatchObject({
      id: loggedIn.body.user.id,
      email,
    });
  });

  it("rejects unauthenticated me, invalid login, and unauthenticated post creation", async () => {
    const me = await api("/api/auth/me");
    expect(me.response.status).toBe(401);

    const badLogin = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: ownerEmail, password: "wrong-password" }),
    });
    expect(badLogin.response.status).toBe(401);

    const create = await api("/api/posts", {
      method: "POST",
      body: JSON.stringify({ title: "No auth", contentHtml: "<p>Nope</p>" }),
    });
    expect(create.response.status).toBe(401);
  });

  it("creates, lists, views, edits, and deletes posts over HTTP", async () => {
    const token = await login();

    const created = await api("/api/posts", {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify({
        title: "First integration post",
        contentHtml: "<p>Hello from integration tests</p>",
        tags: ["nextjs", "neon"],
        publishedAt: "2026-05-01T08:00:00.000Z",
      }),
    });

    expect(created.response.status).toBe(201);
    expect(created.body.post).toMatchObject({
      title: "First integration post",
      contentHtml: "<p>Hello from integration tests</p>",
      tags: ["nextjs", "neon"],
      publishedAt: "2026-05-01T08:00:00.000Z",
    });

    const postId = created.body.post.id;

    const list = await api("/api/posts?page=1&limit=5");
    expect(list.response.status).toBe(200);
    expect(list.body).toMatchObject({ page: 1, limit: 5, total: 1, totalPages: 1 });
    expect(list.body.items).toEqual([
      expect.objectContaining({ id: postId, title: "First integration post" }),
    ]);

    const viewed = await api(`/api/posts/${postId}`);
    expect(viewed.response.status).toBe(200);
    expect(viewed.body.post).toMatchObject({
      id: postId,
      authorEmail: ownerEmail,
      title: "First integration post",
    });

    const edited = await api(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: auth(token),
      body: JSON.stringify({
        title: "Updated integration post",
        contentHtml: "<p>Updated body</p>",
        tags: ["updated"],
        publishedAt: null,
      }),
    });

    expect(edited.response.status).toBe(200);
    expect(edited.body.post).toMatchObject({
      id: postId,
      title: "Updated integration post",
      contentHtml: "<p>Updated body</p>",
      tags: ["updated"],
      publishedAt: null,
    });

    const deleted = await api(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: auth(token),
    });
    expect(deleted.response.status).toBe(200);
    expect(deleted.body).toEqual({ deleted: true });

    const missing = await api(`/api/posts/${postId}`);
    expect(missing.response.status).toBe(404);
  });

  it("forbids non-owners from editing and deleting posts", async () => {
    const ownerToken = await login(ownerEmail);
    const otherToken = await login(otherEmail);

    const created = await api("/api/posts", {
      method: "POST",
      headers: auth(ownerToken),
      body: JSON.stringify({
        title: "Owner-only post",
        contentHtml: "<p>Only the owner can change this</p>",
      }),
    });

    expect(created.response.status).toBe(201);
    const postId = created.body.post.id;

    const edit = await api(`/api/posts/${postId}`, {
      method: "PATCH",
      headers: auth(otherToken),
      body: JSON.stringify({ title: "Hijacked" }),
    });
    expect(edit.response.status).toBe(403);
    expect(edit.body).toEqual({ error: "You do not own this post." });

    const remove = await api(`/api/posts/${postId}`, {
      method: "DELETE",
      headers: auth(otherToken),
    });
    expect(remove.response.status).toBe(403);

    const stillThere = await api(`/api/posts/${postId}`);
    expect(stillThere.response.status).toBe(200);
    expect(stillThere.body.post.title).toBe("Owner-only post");
  });

  it("validates post payloads and ids", async () => {
    const token = await login();

    const invalidCreate = await api("/api/posts", {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify({ title: "", contentHtml: "<p>Body</p>" }),
    });
    expect(invalidCreate.response.status).toBe(400);

    const invalidTags = await api("/api/posts", {
      method: "POST",
      headers: auth(token),
      body: JSON.stringify({
        title: "Bad tags",
        contentHtml: "<p>Body</p>",
        tags: ["ok", 1],
      }),
    });
    expect(invalidTags.response.status).toBe(400);

    const invalidId = await api("/api/posts/not-a-number");
    expect(invalidId.response.status).toBe(400);

    const missing = await api("/api/posts/999999");
    expect(missing.response.status).toBe(404);
  });
});
