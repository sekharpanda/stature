import { Building2, FileText, Plug, Workflow } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BlogApiSyncControls } from "@/features/admin/components/api-fetch/blog-api-sync-controls";
import { CustomApiSources } from "@/features/admin/components/api-fetch/custom-api-sources";
import { LeadRatSyncControls } from "@/features/admin/components/properties/leadrat-sync-controls";
import {
  getSession,
  getUserPermissionKeys,
  requirePermission,
} from "@/lib/auth";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { apiSourceService } from "@/services/api-source.service";
import { blogSyncService } from "@/services/blog-sync.service";
import { propertySyncService } from "@/services/property-sync.service";

export const metadata = {
  title: "API Fetch",
  robots: { index: false, follow: false },
};

export default async function AdminApiFetchPage() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const keys = new Set(await getUserPermissionKeys(session.user.id));
  const canProperties = keys.has("property:sync") && keys.has("property:read");
  const canCms = keys.has("cms:blog");

  if (!canProperties && !canCms) {
    throw new ForbiddenError("Missing permission: property:sync or cms:blog");
  }

  if (canCms) await requirePermission("cms:blog");
  else await requirePermission("property:sync");

  const propertyData = canProperties
    ? await propertySyncService.getOverview().catch(() => null)
    : null;
  const blogData = canCms
    ? await blogSyncService.getOverview().catch(() => null)
    : null;
  const customSources = canCms
    ? await apiSourceService.list().catch(() => [])
    : [];

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Integrations</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">API Fetch</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Pull any JSON API into the website on demand — properties, developers,
          areas, communities, agents, amenities, blogs, market insights, pages,
          FAQs, and more. Built-in shortcuts remain for LeadRat and WordPress.
        </p>
      </div>

      {canCms ? (
        <Card className="rounded-[3px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="size-4" />
              Custom API sources
            </CardTitle>
            <CardDescription>
              Choose what to fill (inventory or content), map fields, preview,
              then fetch &amp; integrate into the live site.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CustomApiSources sources={customSources} />
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {canProperties && propertyData ? (
          <Card className="rounded-[3px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="size-4" />
                Properties (LeadRat)
              </CardTitle>
              <CardDescription>
                Sync Off Plan listings (covers, prices, galleries).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Total", value: propertyData.overview.total },
                  { label: "Synced", value: propertyData.overview.synced },
                  { label: "Failed", value: propertyData.overview.failed },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-md border px-2 py-3">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="font-display text-2xl tabular-nums">
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>
              <LeadRatSyncControls connection={propertyData.connection} />
              {propertyData.lastJob ? (
                <div className="rounded-md border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">Last property job</span>
                    <Badge variant="outline">
                      {propertyData.lastJob.status}
                    </Badge>
                    <span className="text-muted-foreground">
                      {propertyData.lastJob.createdAt.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : null}

        {canCms && blogData ? (
          <Card className="rounded-[3px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="size-4" />
                Quick blog fetch
              </CardTitle>
              <CardDescription>
                One-off WordPress / JSON pull without saving a source. Prefer
                Custom API sources above for reusable integrations.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-2 text-center">
                {[
                  { label: "Total", value: blogData.counts.total },
                  { label: "Published", value: blogData.counts.published },
                  { label: "From API", value: blogData.counts.synced },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-md border px-2 py-3">
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                    <p className="font-display text-2xl tabular-nums">
                      {kpi.value}
                    </p>
                  </div>
                ))}
              </div>
              <BlogApiSyncControls connection={blogData.connection} />
            </CardContent>
          </Card>
        ) : null}
      </div>

      <Card className="rounded-[3px]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plug className="size-4" />
            How it works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
            <li>
              Paste any JSON API URL and choose a target (Property, Developer,
              Area, Insight, Blog, etc.).
            </li>
            <li>
              Map fields with <code className="text-xs">websiteField=api.path</code>{" "}
              (supports nested paths like <code className="text-xs">body.html</code>).
            </li>
            <li>
              Click <strong>Preview</strong> to verify items, then{" "}
              <strong>Fetch &amp; integrate</strong> to write into the site.
            </li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
