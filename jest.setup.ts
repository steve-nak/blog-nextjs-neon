process.env.JWT_SECRET = "test-jwt-secret";
process.env.DATABASE_URL = "postgres://user:pass@localhost:5432/blog_test";
process.env.R2_PUBLIC_URL = "https://cdn.example.com";
process.env.R2_URL = "https://s3.example.com";
process.env.R2_ACCESS_KEY_ID = "test-access-key";
process.env.R2_SECRET_ACCESS_KEY = "test-secret";
process.env.R2_BUCKET = "blog-test";

afterEach(() => {
  jest.restoreAllMocks();
});