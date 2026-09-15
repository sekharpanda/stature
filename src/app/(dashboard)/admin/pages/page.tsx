import Link from "next/link";
import { FileText, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  STATIC_PAGE_KEYS,
  STATIC_PAGE_META,
} from "@/config/page-content-defaults";
import { StaticPageContentEditor } from "@/features/admin/components/static-page-content-editor";
import { organizationRepository } from "@/repositories/organization.repository";
import { customPageService } from "@/services/custom-page.service";
import { pageContentService } from "@/services/page-content.service";

export const metadata = {
  title: "Pages",
  robots: { index: false, follow: false },
};

export default async function AdminPagesPage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const [contents, customPages] = await Promise.all([
    pageContentService.getMany([...STATIC_PAGE_KEYS], org.id),
    customPageService.list(org.id),
  ]);

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CMS · Content</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Pages</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Edit the core marketing pages, or add a new URL such as /careers
            without writing code. Drop in listings, a map, team, FAQs, blog or
            a lead form like WordPress widgets. Put new pages in the header from
            Menus & footer.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline" className="rounded-lg">
            <Link href="/admin/homepage">Homepage builder</Link>
          </Button>
          <Button asChild className="rounded-lg">
            <Link href="/admin/pages/new">
              <Plus className="mr-1 size-4" />
              Add page
            </Link>
          </Button>
        </div>
      </div>

      {customPages.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-display text-xl">Your pages</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {customPages.map((page) => (
              <Link
                key={page.id}
                href={`/admin/pages/${page.id}`}
                className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4 transition hover:border-primary/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                  <FileText className="size-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{page.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">
                    /{page.slug} · {page.workflowState === "PUBLISHED" ? "Live" : "Draft"}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {STATIC_PAGE_KEYS.map((key) => {
          const meta = STATIC_PAGE_META[key];
          return (
            <a
              key={key}
              href={`#page-${key}`}
              className="flex items-start gap-3 rounded-xl border border-border/80 bg-card p-4 transition hover:border-primary/40"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                <FileText className="size-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">{meta.label}</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {meta.href}
                </span>
              </span>
            </a>
          );
        })}
      </div>

      <div className="space-y-6">
        {STATIC_PAGE_KEYS.map((key) => (
          <StaticPageContentEditor
            key={key}
            organizationId={org.id}
            pageKey={key}
            initialContent={contents[key]}
          />
        ))}
      </div>
    </div>
  );
}
