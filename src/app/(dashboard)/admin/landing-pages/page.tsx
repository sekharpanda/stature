import Link from "next/link";
import { Rocket } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Landing Pages",
  robots: { index: false, follow: false },
};

export default async function AdminLandingPagesPage() {
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const pages = await prisma.landingPage.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">CMS</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">Landing pages</h1>
          <p className="mt-2 text-muted-foreground">
            Google Ads landing pages. Publish to
            prowinproperties.com/dubai-projects/project-name.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/landing-pages/new">New landing page</Link>
        </Button>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">All landing pages</CardTitle>
          <CardDescription>
            Drafts and published campaign landing surfaces.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {pages.length === 0 ? (
            <EmptyState
              icon={Rocket}
              title="No landing pages yet"
              description="Create a campaign page to get started."
              className="py-12"
              actionLabel="New landing page"
              actionHref="/admin/landing-pages/new"
            />
          ) : (
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-left text-sm">
                <thead className="border-b bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Title</th>
                    <th className="px-4 py-3 font-medium">Slug</th>
                    <th className="px-4 py-3 font-medium">Campaign</th>
                    <th className="px-4 py-3 font-medium">State</th>
                    <th className="px-4 py-3 font-medium">Published</th>
                  </tr>
                </thead>
                <tbody>
                  {pages.map((page) => (
                    <tr key={page.id} className="border-b last:border-0">
                      <td className="px-4 py-3 font-medium">
                        <Link
                          href={`/admin/landing-pages/${page.id}`}
                          className="hover:underline"
                        >
                          {page.title}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {page.workflowState === "PUBLISHED" ? (
                          <Link
                            href={`/dubai-projects/${page.slug}`}
                            className="hover:underline"
                            target="_blank"
                          >
                            /dubai-projects/{page.slug}
                          </Link>
                        ) : (
                          page.slug
                        )}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {page.campaign ?? "—"}
                      </td>
                      <td className="px-4 py-3">{page.workflowState}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {page.publishedAt
                          ? format(page.publishedAt, "dd MMM yyyy")
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
