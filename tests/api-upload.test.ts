const mockGetAuthenticatedUser = jest.fn();
const mockUploadFileToR2 = jest.fn();
const mockDeleteR2ObjectFromUrl = jest.fn();
const mockIsR2PublicUrl = jest.fn();

jest.mock("@/lib/auth", () => ({
  getAuthenticatedUser: mockGetAuthenticatedUser,
}));

jest.mock("@/lib/r2", () => ({
  uploadFileToR2: mockUploadFileToR2,
  deleteR2ObjectFromUrl: mockDeleteR2ObjectFromUrl,
  isR2PublicUrl: mockIsR2PublicUrl,
}));

let route: typeof import("../app/api/upload/route");

beforeAll(async () => {
  route = await import("../app/api/upload/route");
});

beforeEach(() => {
  jest.clearAllMocks();
  mockDeleteR2ObjectFromUrl.mockResolvedValue(undefined);
  mockUploadFileToR2.mockResolvedValue("https://cdn.example.com/cover-images/one.png");
});

describe("POST /api/upload", () => {
  it("rejects unauthenticated requests", async () => {
    mockGetAuthenticatedUser.mockResolvedValue(null);

    const response = await route.POST(new Request("http://localhost/api/upload"));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized." });
  });

  it("rejects missing files", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 1, email: "author@example.com" });

    const response = await route.POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: new FormData(),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "A file is required." });
  });

  it("rejects non-image files", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 1, email: "author@example.com" });
    const formData = new FormData();
    formData.set("file", new File(["hello"], "notes.txt", { type: "text/plain" }));

    const response = await route.POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Only image files are allowed.",
    });
  });

  it("uploads image files", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 1, email: "author@example.com" });
    const formData = new FormData();
    const file = new File(["image-bytes"], "cover.png", { type: "image/png" });
    formData.set("file", file);

    const response = await route.POST(
      new Request("http://localhost/api/upload", {
        method: "POST",
        body: formData,
      })
    );

    expect(response.status).toBe(201);
    expect(mockUploadFileToR2).toHaveBeenCalledTimes(1);
    const uploadedFile = mockUploadFileToR2.mock.calls[0][0] as File;
    expect(uploadedFile.name).toBe(file.name);
    expect(uploadedFile.type).toBe(file.type);
    await expect(response.json()).resolves.toEqual({
      url: "https://cdn.example.com/cover-images/one.png",
    });
  });
});

describe("DELETE /api/upload", () => {
  it("rejects invalid urls", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 1, email: "author@example.com" });
    mockIsR2PublicUrl.mockReturnValue(false);

    const response = await route.DELETE(
      new Request("http://localhost/api/upload", {
        method: "DELETE",
        body: JSON.stringify({ url: "https://example.com/image.png" }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "A valid image URL is required.",
    });
  });

  it("deletes uploaded files", async () => {
    mockGetAuthenticatedUser.mockResolvedValue({ id: 1, email: "author@example.com" });
    mockIsR2PublicUrl.mockReturnValue(true);

    const response = await route.DELETE(
      new Request("http://localhost/api/upload", {
        method: "DELETE",
        body: JSON.stringify({
          url: "https://cdn.example.com/cover-images/one.png",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(mockDeleteR2ObjectFromUrl).toHaveBeenCalledWith(
      "https://cdn.example.com/cover-images/one.png"
    );
    await expect(response.json()).resolves.toEqual({ deleted: true });
  });
});