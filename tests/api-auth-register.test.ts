const mockDb = {
  select: jest.fn(),
  insert: jest.fn(),
} as any;

const mockReadJsonBody = jest.fn();
const mockCreateAuthToken = jest.fn();
const mockSerializeUser = jest.fn();
const mockHash = jest.fn();

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
    hash: mockHash,
  },
}));

import { createInsertChain, createSelectChain } from "./helpers";

let route: typeof import("../app/api/auth/register/route");

beforeAll(async () => {
  route = await import("../app/api/auth/register/route");
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/auth/register", () => {
  it("rejects missing credentials", async () => {
    mockReadJsonBody.mockResolvedValue({});

    const response = await route.POST(new Request("http://localhost/api/auth/register"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Email and password are required.",
    });
  });

  it("rejects short passwords", async () => {
    mockReadJsonBody.mockResolvedValue({ email: "new@example.com", password: "123" });

    const response = await route.POST(new Request("http://localhost/api/auth/register"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Password must be at least 6 characters long.",
    });
  });

  it("rejects duplicate emails", async () => {
    mockReadJsonBody.mockResolvedValue({ email: "new@example.com", password: "secret123" });
    mockDb.select.mockReturnValue(createSelectChain([{ id: 1 }], "limit"));

    const response = await route.POST(new Request("http://localhost/api/auth/register"));

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "An account with that email already exists.",
    });
  });

  it("creates an account and returns a token", async () => {
    mockReadJsonBody.mockResolvedValue({ email: "new@example.com", password: "secret123" });
    mockDb.select.mockReturnValue(createSelectChain([], "limit"));
    mockHash.mockResolvedValue("hashed-password");
    mockDb.insert.mockReturnValue(
      createInsertChain([
        {
          id: 9,
          email: "new@example.com",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
        },
      ])
    );
    mockCreateAuthToken.mockReturnValue("signed-token");
    mockSerializeUser.mockReturnValue({
      id: 9,
      email: "new@example.com",
      createdAt: "2024-01-01T00:00:00.000Z",
    });

    const response = await route.POST(new Request("http://localhost/api/auth/register"));

    expect(response.status).toBe(201);
    expect(mockHash).toHaveBeenCalledWith("secret123", 10);
    expect(mockCreateAuthToken).toHaveBeenCalledWith({ id: 9, email: "new@example.com" });
    await expect(response.json()).resolves.toEqual({
      user: {
        id: 9,
        email: "new@example.com",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
      token: "signed-token",
      tokenType: "Bearer",
    });
  });
});