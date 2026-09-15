import Link from "next/link";

import type { PublicBlogListItem } from "@/services/blog.service";

function formatDate(value: Date | null) {
  if (!value) return null;
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function PublicBlogCard({ post }: { post: PublicBlogListItem }) {
  const date = formatDate(post.publishedAt);
  return (
    <article className="group flex flex-col overflow-hidden border border-line bg-white transition hover:border-ink/30">
      <Link href={`/blog/${post.slug}`} className="block">
        <div className="aspect-[16/10] overflow-hidden bg-mist">
          {post.coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.coverUrl}
              alt={`Cover image for ${post.title}`}
              loading="lazy"
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full items-end bg-gradient-to-br from-ink/90 to-red p-6">
              <span className="font-display text-2xl text-white/90">
                Insights
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex flex-1 flex-col p-5">
        {date || post.readingMinutes ? (
          <p className="text-xs font-semibold tracking-[0.16em] text-red uppercase">
            {[date, post.readingMinutes ? `${post.readingMinutes} min read` : null]
              .filter(Boolean)
              .join(" · ")}
          </p>
        ) : null}
        <h2 className="mt-2 font-display text-2xl leading-snug">
          <Link href={`/blog/${post.slug}`} className="hover:text-red">
            {post.title}
          </Link>
        </h2>
        {post.excerpt ? (
          <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-slate">
            {post.excerpt}
          </p>
        ) : null}
        <Link
          href={`/blog/${post.slug}`}
          className="mt-auto pt-5 text-sm font-semibold text-ink underline-offset-4 hover:text-red hover:underline"
        >
          Read article
        </Link>
      </div>
    </article>
  );
}
