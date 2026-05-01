const mockDb = {
  select: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
} as any;

const mockGetAuthenticatedUser = jest.fn();
const mockReadJsonBody = jest.fn();
const mockSerializePost = jest.fn();
const mockDeleteR2ObjectFromUrl = jest.fn();
const mockIsR2PublicUrl = jest.fn();

jest.mock("@/db", () => ({
  db: mockDb,
}));

jest.mock("@/lib/auth", () => ({
  getAuthenticatedUser: mockGetAuthenticatedUser,
  readJsonBody: mockReadJsonBody,
  serializePost: mockSerializePost,
}));

jest.mock("@/lib/r2", () => ({
  deleteR2ObjectFromUrl: mockDeleteR2ObjectFromUrl,
  isR2PublicUrl: mockIsR2PublicUrl,
}));

import { createDeleteChain, createSelectChain, createUpdateChain } from "./helpers";

let route: typeof import("../app/api/posts/[id]/route");

beforeAll(async () => {
  route = await import("../app/api/posts/[id]/route");
});

beforeEach(() => {
  jest.clearAllMocks();
  mockDeleteR2ObjectFromUrl.mockResolvedValue(undefined);
});

function requestWithParams(id: string, init: RequestInit = {}) {
  return new Request(`http://localhost/api/posts/${id}`, init);
}

describe("GET /api/posts/[id]", () => {
  it("rejects invalid ids", async () => {
    const response = await route.GET(requestWithParams("abc"), {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid post id." });
  });

  it("returns not found for missing posts", async () => {
    mockDb.select.mockReturnValue(createSelectChain([], "limit"));

    const response = await route.GET(requestWithParams("1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({ error: "Post not found." });
  });

  it("returns a post", async () => {
    const post = {
      id: 1,
      authorId: 7,
      authorEmail: "author@example.com",
      title: "First post",
      contentHtml: "<p>Hello</p>",
      coverImageUrl: null,
      tags: ["nextjs"],
      publishedAt: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    };

    mockDb.select.mockReturnValue(createSelectChain([post], "limit"));
    mockSerializePost.mockImplementation((value) => ({
      ...value,
      createdAt: value.createdAt.toISOString(),
      updatedAt: value.updatedAt.toISOString(),
      serialized: true,
    }));

    const response = await route.GET(requestWithParams("1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      post: {
        ...post,
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-02T00:00:00.000Z",
        serialized: true,
      },
    });
  });
});

describe("PATCH /api/posts/[id]", () => {
  it("rejects unauthenticated requests", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const response = await route.PATCH(requestWithParams("1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
  });

  it("rejects invalid ids", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 7, email: "author@example.com" });

    const response = await route.PATCH(requestWithParams("abc"), {
      params: Promise.resolve({ id: "abc" }),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "Invalid post id." });
  });

  it("rejects updates from non-owners", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 7, email: "author@example.com" });
    mockDb.select.mockReturnValue(
      createSelectChain(
        [
          {
            id: 1,
            authorId: 8,
            authorEmail: "someone-else@example.com",
            coverImageUrl: null,
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          },
        ],
        "limit"
      )
    );

    const response = await route.PATCH(requestWithParams("1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({ error: "You do not own this post." });
  });

  it("updates a post and cleans up replaced cover images", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 7, email: "author@example.com" });
    mockDb.select.mockReturnValue(
      createSelectChain(
        [
          {
            id: 1,
            authorId: 7,
            authorEmail: "author@example.com",
            coverImageUrl: "https://cdn.example.com/cover-images/old.png",
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          },
        ],
        "limit"
      )
    );
    mockReadJsonBody.mockResolvedValue({
      title: "Updated title",
      contentHtml: "<p>Updated</p>",
      coverImageUrl: "https://cdn.example.com/cover-images/new.png",
      tags: ["nextjs"],
      publishedAt: "2024-02-01T00:00:00.000Z",
    });
    mockIsR2PublicUrl.mockReturnValue(true);
    mockDb.update.mockReturnValue(
      createUpdateChain([
        {
          id: 1,
          authorId: 7,
          authorEmail: "author@example.com",
          title: "Updated title",
          contentHtml: "<p>Updated</p>",
          coverImageUrl: "https://cdn.example.com/cover-images/new.png",
          tags: ["nextjs"],
          publishedAt: new Date("2024-02-01T00:00:00.000Z"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-02-02T00:00:00.000Z"),
        },
      ])
    );
    mockSerializePost.mockReturnValue({
      id: 1,
      title: "Updated title",
      updatedAt: "2024-02-02T00:00:00.000Z",
    });

    const response = await route.PATCH(requestWithParams("1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(200);
    expect(mockDeleteR2ObjectFromUrl).toHaveBeenCalledWith(
      "https://cdn.example.com/cover-images/old.png"
    );
    await expect(response.json()).resolves.toEqual({
      post: {
        id: 1,
        title: "Updated title",
        updatedAt: "2024-02-02T00:00:00.000Z",
      },
    });
  });
});

describe("DELETE /api/posts/[id]", () => {
  it("rejects unauthenticated requests", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const response = await route.DELETE(requestWithParams("1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
  });

  it("deletes a post and its cover image", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 7, email: "author@example.com" });
    mockDb.select.mockReturnValue(
      createSelectChain(
        [
          {
            id: 1,
            authorId: 7,
            authorEmail: "author@example.com",
            coverImageUrl: "https://cdn.example.com/cover-images/old.png",
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
            updatedAt: new Date("2024-01-01T00:00:00.000Z"),
          },
        ],
        "limit"
      )
    );
    mockDb.delete.mockReturnValue(createDeleteChain());

    const response = await route.DELETE(requestWithParams("1"), {
      params: Promise.resolve({ id: "1" }),
    });

    expect(response.status).toBe(200);
    expect(mockDb.delete).toHaveBeenCalledTimes(1);
    expect(mockDeleteR2ObjectFromUrl).toHaveBeenCalledWith(
      "https://cdn.example.com/cover-images/old.png"
    );
    await expect(response.json()).resolves.toEqual({ deleted: true });
  });
});