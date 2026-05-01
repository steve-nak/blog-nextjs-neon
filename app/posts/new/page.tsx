import { PostForm } from "../../components/PostForm";

export default function NewPostPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">New post</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950">Publish new content</h1>
      </div>
      <PostForm mode="create" />
    </div>
  );
}
