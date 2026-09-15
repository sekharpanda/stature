import { Images } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { EmptyState } from "@/features/admin/components/shared/empty-state";
import {
  DeleteMediaButton,
  MediaUploadPanel,
} from "@/features/admin/components/media-upload-panel";
import { organizationRepository } from "@/repositories/organization.repository";
import { mediaRepository } from "@/repositories/media.repository";

export const metadata = {
  title: "Media Library",
  robots: { index: false, follow: false },
};

function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminMediaPage() {
  const org = await organizationRepository.getDefault();
  if (!org) {
    return <p className="text-muted-foreground">Organization not seeded.</p>;
  }

  const assets = await mediaRepository.listAssets(org.id);

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Media</p>
        <h1 className="mt-2 font-display text-3xl md:text-4xl">Media library</h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Upload and manage covers, galleries, brochures and logos for Dubai
          inventory and CMS.
        </p>
      </div>

      <MediaUploadPanel />

      <div className="grid gap-3 sm:grid-cols-3">
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>Total assets</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {assets.length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>Images</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {assets.filter((a) => a.type === "IMAGE").length}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-border/80">
          <CardHeader className="pb-2">
            <CardDescription>Documents</CardDescription>
            <CardTitle className="text-3xl tabular-nums">
              {
                assets.filter(
                  (a) => a.type === "DOCUMENT" || a.type === "PDF",
                ).length
              }
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Assets</CardTitle>
          <CardDescription>
            Synced and manually uploaded media in one registry.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <EmptyState
              icon={Images}
              title="Library is empty"
              description="Upload files above or sync Off Plan inventory."
              className="py-12"
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {assets.slice(0, 48).map((asset) => (
                <article
                  key={asset.id}
                  className="overflow-hidden rounded-xl border border-neutral-200 bg-white"
                >
                  <div className="aspect-[4/3] bg-neutral-100">
                    {asset.type === "IMAGE" && asset.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={asset.url}
                        alt={asset.alt ?? asset.originalName}
                        className="size-full object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center">
                        <Images className="size-8 text-neutral-400" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate text-sm font-medium">
                        {asset.title || asset.originalName}
                      </p>
                      <DeleteMediaButton id={asset.id} />
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {asset.url}
                    </p>
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline">{asset.type}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatBytes(asset.sizeBytes)}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
