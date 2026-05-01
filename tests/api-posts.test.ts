const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
} as any;

const mockGetAuthenticatedUser = jest.fn();
const mockReadJsonBody = jest.fn();
const mockSerializePost = jest.fn();
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
  isR2PublicUrl: mockIsR2PublicUrl,
}));

import { createInsertChain, createSelectChain } from "./helpers";

let route: typeof import("../app/api/posts/route");

beforeAll(async () => {
  route = await import("../app/api/posts/route");
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/posts", () => {
  it("returns paginated posts", async () => {
    mockDb.select
      .mockReturnValueOnce(createSelectChain([{ total: 2 }], "from"))
      .mockReturnValueOnce(
        createSelectChain(
          [
            {
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
            },
          ],
          "offset"
        )
      );
    mockSerializePost.mockImplementation((post) => ({ ...post, serialized: true }));

    const response = await route.GET(
      new Request("http://localhost/api/posts?page=2&limit=5")
    );

    expect(response.status).toBe(200);
    expect(mockDb.select).toHaveBeenCalledTimes(2);
    await expect(response.json()).resolves.toEqual({
      items: [
        {
          id: 1,
          authorId: 7,
          authorEmail: "author@example.com",
          title: "First post",
          contentHtml: "<p>Hello</p>",
          coverImageUrl: null,
          tags: ["nextjs"],
          publishedAt: null,
          createdAt: "2024-01-01T00:00:00.000Z",
          updatedAt: "2024-01-02T00:00:00.000Z",
          serialized: true,
        },
      ],
      page: 2,
      limit: 5,
      total: 2,
      totalPages: 1,
    });
  });
});

describe("POST /api/posts", () => {
  it("rejects unauthenticated requests", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const response = await route.POST(new Request("http://localhost/api/posts"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
  });

  it("rejects invalid payloads", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 7, email: "author@example.com" });
    mockReadJsonBody.mockResolvedValue({ title: "", contentHtml: "<p>Body</p>" });

    const response = await route.POST(new Request("http://localhost/api/posts"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Title and contentHtml are required.",
    });
  });

  it("rejects invalid tags", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 7, email: "author@example.com" });
    mockReadJsonBody.mockResolvedValue({
      title: "Hello",
      contentHtml: "<p>Body</p>",
      tags: [1],
    });

    const response = await route.POST(new Request("http://localhost/api/posts"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Tags must be an array of strings.",
    });
  });

  it("creates a post", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 7, email: "author@example.com" });
    mockReadJsonBody.mockResolvedValue({
      title: "Hello",
      contentHtml: "<p>Body</p>",
      coverImageUrl: "https://cdn.example.com/cover-images/one.png",
      tags: ["nextjs"],
      publishedAt: "2024-01-03T00:00:00.000Z",
    });
    mockIsR2PublicUrl.mockReturnValue(true);
    mockDb.insert.mockReturnValue(
      createInsertChain([
        {
          id: 11,
          authorId: 7,
          title: "Hello",
          contentHtml: "<p>Body</p>",
          coverImageUrl: "https://cdn.example.com/cover-images/one.png",
          tags: ["nextjs"],
          publishedAt: new Date("2024-01-03T00:00:00.000Z"),
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          updatedAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ])
    );
    mockSerializePost.mockImplementation((post) => ({
      id: post.id,
      title: post.title,
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      publishedAt: post.publishedAt ? post.publishedAt.toISOString() : null,
    }));

    const response = await route.POST(new Request("http://localhost/api/posts"));

    expect(response.status).toBe(201);
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    await expect(response.json()).resolves.toEqual({
      post: {
        id: 11,
        title: "Hello",
        createdAt: "2024-01-01T00:00:00.000Z",
        updatedAt: "2024-01-01T00:00:00.000Z",
        publishedAt: "2024-01-03T00:00:00.000Z",
      },
    });
  });
});