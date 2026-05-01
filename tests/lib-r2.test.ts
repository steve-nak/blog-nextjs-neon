const mockSend = jest.fn();
const mockS3Client = jest.fn().mockImplementation(() => ({ send: mockSend }));

class MockPutObjectCommand {
  input: unknown;

  constructor(input: unknown) {
    this.input = input;
  }
}

class MockDeleteObjectCommand {
  input: unknown;

  constructor(input: unknown) {
    this.input = input;
  }
}

jest.mock("@aws-sdk/client-s3", () => ({
  __esModule: true,
  S3Client: mockS3Client,
  PutObjectCommand: MockPutObjectCommand,
  DeleteObjectCommand: MockDeleteObjectCommand,
}));

jest.mock("node:crypto", () => ({
  randomUUID: jest.fn(() => "uuid-123"),
}));

let r2: typeof import("../lib/r2");

beforeAll(async () => {
  r2 = await import("../lib/r2");
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("lib/r2", () => {
  it("builds and validates public urls", () => {
    expect(r2.getR2PublicBaseUrl()).toBe("https://cdn.example.com");
    expect(r2.buildR2PublicUrl("cover-images/example.png")).toBe(
      "https://cdn.example.com/cover-images/example.png"
    );
    expect(r2.isR2PublicUrl("https://cdn.example.com/cover-images/example.png")).toBe(true);
    expect(r2.isR2PublicUrl("https://example.com/cover-images/example.png")).toBe(false);
  });

  it("uploads files to R2 without hitting the network", async () => {
    const file = new File(["image-bytes"], "cover.png", { type: "image/png" });

    await expect(r2.uploadFileToR2(file)).resolves.toBe(
      "https://cdn.example.com/cover-images/uuid-123.png"
    );

    expect(mockS3Client).toHaveBeenCalledTimes(1);
    expect(mockSend).toHaveBeenCalledTimes(1);

    const command = mockSend.mock.calls[0][0] as MockPutObjectCommand;
    expect(command.input).toMatchObject({
      Bucket: "blog-test",
      Key: "cover-images/uuid-123.png",
      ContentType: "image/png",
    });
  });

  it("deletes objects for matching public urls", async () => {
    await expect(
      r2.deleteR2ObjectFromUrl(
        "https://cdn.example.com/cover-images/uuid-123.png"
      )
    ).resolves.toBeUndefined();

    expect(mockSend).toHaveBeenCalledTimes(1);

    const command = mockSend.mock.calls[0][0] as MockDeleteObjectCommand;
    expect(command.input).toMatchObject({
      Bucket: "blog-test",
      Key: "cover-images/uuid-123.png",
    });
  });

  it("ignores foreign urls when deleting", async () => {
    await expect(r2.deleteR2ObjectFromUrl("https://example.com/image.png")).resolves.toBeUndefined();
    expect(mockSend).not.toHaveBeenCalled();
  });
});