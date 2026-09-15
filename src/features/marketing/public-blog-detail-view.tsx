import Link from "next/link";

import { LeadModalCta } from "@/features/leads/components/site-lead-capture-modal";
import type { PublicBlogDetail } from "@/services/blog.service";
import { sanitizeBlogHtml } from "@/lib/blog-html";

function formatDate(value: Date | null) {
  if (!value) return null;
  return value.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function PublicBlogDetailView({ post }: { post: PublicBlogDetail }) {
  const date = formatDate(post.publishedAt);
  const html = sanitizeBlogHtml(post.content);

  return (
    <article>
      <div className="border-b border-line bg-white">
        <div className="mx-auto max-w-[760px] px-6 py-12 md:py-16">
          <Link
            href="/blog"
            className="text-sm font-medium text-slate transition hover:text-ink"
          >
            ← All articles
          </Link>
          {date || post.readingMinutes ? (
            <p className="mt-6 text-xs font-semibold tracking-[0.22em] text-red uppercase">
              {[
                date,
                post.readingMinutes ? `${post.readingMinutes} min read` : null,
              ]
                .filter(Boolean)
                .join(" · ")}
            </p>
          ) : null}
          <h1 className="mt-3 font-display text-4xl md:text-5xl">{post.title}</h1>
          {post.excerpt ? (
            <p className="mt-5 text-lg text-slate md:text-xl">{post.excerpt}</p>
          ) : null}
        </div>
      </div>

      {post.coverUrl ? (
        <div className="border-b border-line bg-mist">
          <div className="mx-auto max-w-[980px] px-6 py-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverUrl}
              alt={`Cover image for ${post.title}`}
              className="aspect-[16/9] w-full object-cover"
            />
          </div>
        </div>
      ) : null}

      <div className="bg-white">
        <div className="mx-auto max-w-[760px] px-6 py-12 md:py-16">
          {html ? (
            <div
              className="blog-article-body"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <p className="text-slate">
              This article does not have body content yet.
            </p>
          )}
        </div>
      </div>

      <div className="border-t border-line bg-mist">
        <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-between gap-4 px-6 py-10">
          <div>
            <p className="font-display text-2xl">Talk to Prowin</p>
            <p className="mt-1 text-sm text-slate">
              Exploring Dubai off-plan or ready stock? We’re here to help.
            </p>
          </div>
          <LeadModalCta
            leadSource="blog_cta"
            campaign={post.slug}
            className="inline-flex items-center bg-red px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-dark"
          >
            Contact us
          </LeadModalCta>
        </div>
      </div>
    </article>
  );
}
