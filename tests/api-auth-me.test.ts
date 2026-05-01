const mockGetAuthenticatedUser = jest.fn();
const mockSerializeUser = jest.fn();

jest.mock("@/lib/auth", () => ({
  getAuthenticatedUser: mockGetAuthenticatedUser,
  serializeUser: mockSerializeUser,
}));

let route: typeof import("../app/api/auth/me/route");

beforeAll(async () => {
  route = await import("../app/api/auth/me/route");
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("GET /api/auth/me", () => {
  it("rejects unauthenticated requests", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const response = await route.GET(new Request("http://localhost/api/auth/me"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
  });

  it("returns the current user", async () => {
    const user = {
      id: 3,
      email: "reader@example.com",
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
    };

    mockGetAuthenticatedUser.mockResolvedValue(user);
    mockSerializeUser.mockReturnValue({
      id: 3,
      email: "reader@example.com",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    const response = await route.GET(new Request("http://localhost/api/auth/me"));

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      user: {
        id: 3,
        email: "reader@example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    });
  });
});