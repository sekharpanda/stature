import Link from "next/link";

import { Button } from "@/components/ui/button";
import { PostForm } from "@/features/portal/components/post-form";

export const metadata = {
  title: "Write Post",
  robots: { index: false, follow: false },
};

export default function NewPortalPostPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Agent portal</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Write post</h1>
          <p className="mt-2 text-muted-foreground">
            Save a draft while you work on it, then submit it for approval.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/my/posts">Back to my posts</Link>
        </Button>
      </div>

      <PostForm
        live={false}
        values={{
          postId: null,
          title: "",
          excerpt: null,
          content: null,
          coverUrl: null,
          metaTitle: null,
          metaDescription: null,
        }}
      />
    </div>
  );
}
