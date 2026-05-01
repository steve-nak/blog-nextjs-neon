export type User = {
  id: number;
  email: string;
  createdAt: string;
};

export type Post = {
  id: number;
  authorId: number;
  authorEmail: string | null;
  title: string;
  contentHtml: string;
  coverImageUrl: string | null;
  tags: string[] | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PostsResponse = {
  items: Post[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
