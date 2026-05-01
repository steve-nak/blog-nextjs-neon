const mockDb = {
  select: jest.fn(),
} as any;

const mockReadJsonBody = jest.fn();
const mockCreateAuthToken = jest.fn();
const mockSerializeUser = jest.fn();
const mockCompare = jest.fn();

jest.mock("@/db", () => ({
  db: mockDb,
}));

jest.mock("@/lib/auth", () => ({
  createAuthToken: mockCreateAuthToken,
  readJsonBody: mockReadJsonBody,
  serializeUser: mockSerializeUser,
}));

jest.mock("bcrypt", () => ({
  __esModule: true,
  default: {
    compare: mockCompare,
  },
}));

import { createSelectChain } from "./helpers";

let route: typeof import("../app/api/auth/login/route");

beforeAll(async () => {
  route = await import("../app/api/auth/login/route");
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("rejects missing credentials", async () => {
    mockReadJsonBody.mockResolvedValue({});

    const response = await route.POST(new Request("http://localhost/api/auth/login"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Email and password are required.",
    });
  });

  it("rejects invalid credentials", async () => {
    mockReadJsonBody.mockResolvedValue({ email: "reader@example.com", password: "secret123" });
    mockDb.select.mockReturnValue(createSelectChain([], "limit"));

    const response = await route.POST(new Request("http://localhost/api/auth/login"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid credentials." });
  });

  it("rejects mismatched passwords", async () => {
    mockReadJsonBody.mockResolvedValue({ email: "reader@example.com", password: "secret123" });
    mockDb.select.mockReturnValue(
      createSelectChain(
        [
          {
            id: 7,
            email: "reader@example.com",
            passwordHash: "hash",
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
          },
        ],
        "limit"
      )
    );
    mockCompare.mockResolvedValue(false);

    const response = await route.POST(new Request("http://localhost/api/auth/login"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Invalid credentials." });
  });

  it("returns a token for valid credentials", async () => {
    mockReadJsonBody.mockResolvedValue({ email: "reader@example.com", password: "secret123" });
    mockDb.select.mockReturnValue(
      createSelectChain(
        [
          {
            id: 7,
            email: "reader@example.com",
            passwordHash: "hash",
            createdAt: new Date("2024-01-01T00:00:00.000Z"),
          },
        ],
        "limit"
      )
    );
    mockCompare.mockResolvedValue(true);
    mockCreateAuthToken.mockReturnValue("signed-token");
    mockSerializeUser.mockReturnValue({
      id: 7,
      email: "reader@example.com",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    const response = await route.POST(new Request("http://localhost/api/auth/login"));

    expect(response.status).toBe(200);
    expect(mockCreateAuthToken).toHaveBeenCalledWith({ id: 7, email: "reader@example.com" });
    await expect(response.json()).resolves.toEqual({
      user: {
        id: 7,
        email: "reader@example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      token: "signed-token",
      tokenType: "Bearer",
    });
  });
});