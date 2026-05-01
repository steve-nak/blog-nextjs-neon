const mockDb = {
  select: jest.fn(),
} as any;

jest.mock("@/db", () => ({
  db: mockDb,
}));

import { createSelectChain } from "./helpers";

let auth: typeof import("../lib/auth");

beforeAll(async () => {
  auth = await import("../lib/auth");
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("lib/auth", () => {
  it("creates and verifies auth tokens", () => {
    const token = auth.createAuthToken({ id: 42, email: "user@example.com" });
    const payload = auth.verifyAuthToken(token);

    expect(payload).toMatchObject({
      sub: "42",
      email: "user@example.com",
    });
    expect(payload?.exp).toBeGreaterThan(payload!.iat);
  });

  it("extracts bearer tokens", () => {
    expect(
      auth.getBearerToken(
        new Request("http://localhost", {
          headers: { authorization: "Bearer token-value" },
        })
      )
    ).toBe("token-value");

    expect(auth.getBearerToken(new Request("http://localhost"))).toBeNull();
  });

  it("serializes users and posts", () => {
    expect(
      auth.serializeUser({
        id: 7,
        email: "author@example.com",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      })
    ).toEqual({
      id: 7,
      email: "author@example.com",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    expect(
      auth.serializePost({
        id: 1,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-02T00:00:00.000Z"),
        publishedAt: new Date("2024-01-03T00:00:00.000Z"),
      })
    ).toEqual({
      id: 1,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-02T00:00:00.000Z",
      publishedAt: "2024-01-03T00:00:00.000Z",
    });
  });

  it("reads invalid json bodies as null", async () => {
    const request = new Request("http://localhost", {
      method: "POST",
      body: "not-json",
    });

    await expect(auth.readJsonBody(request)).resolves.toBeNull();
  });

  it("loads an authenticated user from the database", async () => {
    const user = {
      id: 12,
      email: "reader@example.com",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    mockDb.select.mockReturnValue(createSelectChain([user], "limit"));

    const request = new Request("http://localhost", {
      headers: {
        authorization: "Bearer " + auth.createAuthToken({ id: 12, email: "reader@example.com" }),
      },
    });

    await expect(auth.getAuthenticatedUser(request)).resolves.toEqual(user);
    expect(mockDb.select).toHaveBeenCalledTimes(1);
  });
});