import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, MapPin } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PropertyAgentSidebar } from "@/features/admin/components/properties/property-agent-sidebar";
import {
  PropertyMarketingOffers,
  type VirtualTourValue,
} from "@/features/admin/components/properties/property-marketing-offers";
import { agentRepository } from "@/repositories/agent.repository";
import { organizationRepository } from "@/repositories/organization.repository";
import { propertyService } from "@/services/property.service";

export const metadata = {
  title: "Property details",
  robots: { index: false, follow: false },
};

function money(
  value: { toString(): string } | null | undefined,
  currency: string,
) {
  if (value == null) return "—";
  const n = Number(value.toString());
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency: currency || "AED",
    maximumFractionDigits: 0,
  }).format(n);
}

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let property;
  try {
    property = await propertyService.getAdminDetail(id);
  } catch {
    notFound();
  }

  const org = await organizationRepository.getDefault();
  const agents = org ? await agentRepository.listAssignable(org.id) : [];

  const cover =
    property.images.find((i) => i.isCover)?.url ?? property.images[0]?.url;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-3">
          <Button asChild variant="ghost" size="sm" className="-ml-2 rounded-[3px]">
            <Link href="/admin/properties?source=leadrat">
              <ArrowLeft className="mr-1.5 size-4" />
              Back to properties
            </Link>
          </Button>
          <div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{property.source}</Badge>
              <Badge variant="secondary">{property.status}</Badge>
              {property.sync?.status ? (
                <Badge
                  variant={
                    property.sync.status === "SYNCED" ? "default" : "outline"
                  }
                >
                  Sync: {property.sync.status}
                </Badge>
              ) : null}
            </div>
            <h1 className="mt-3 font-display text-3xl md:text-4xl">
              {property.name}
            </h1>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-muted-foreground">
              <MapPin className="size-4 shrink-0" />
              {[
                property.address?.community,
                property.address?.district,
                property.address?.city,
                property.address?.country,
              ]
                .filter(Boolean)
                .join(", ") ||
                [property.community?.name, property.area?.name, property.city?.name]
                  .filter(Boolean)
                  .join(", ") ||
                "Location not set"}
            </p>
          </div>
        </div>
        <Button asChild variant="outline" className="rounded-[3px]">
          <Link href="/admin/properties/import">Open sync console</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card className="overflow-hidden rounded-[3px]">
          <div className="relative aspect-[16/9] bg-muted">
            {cover ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cover}
                alt={property.name}
                className="size-full object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center">
                <Building2 className="size-10 text-muted-foreground" />
              </div>
            )}
          </div>
        </Card>

        <Card className="rounded-[3px]">
          <CardHeader>
            <CardTitle className="font-display text-xl">Summary</CardTitle>
            <CardDescription>Commercial, agent and sync snapshot</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Row
              label="Developer"
              value={property.developer?.name ?? "—"}
            />
            <Row
              label="Type"
              value={property.propertyType?.name ?? "—"}
            />
            <Row
              label="Price"
              value={`${money(property.minPrice, property.currency)} – ${money(property.maxPrice, property.currency)}`}
            />
            <Row
              label="Sale status"
              value={property.saleStatus ?? "—"}
            />
            <Row
              label="Construction"
              value={property.constructionStatus ?? "—"}
            />
            <Row
              label="LeadRat ID"
              value={property.leadratProjectId ?? "—"}
            />
            <Row
              label="Last synced"
              value={
                property.sync?.lastSyncedAt
                  ? property.sync.lastSyncedAt.toLocaleString()
                  : "—"
              }
            />
            <PropertyAgentSidebar
              propertyId={property.id}
              agents={agents.map((a) => ({
                id: a.id,
                name: a.name,
                title: a.title,
                phone: a.phone,
                whatsapp: a.whatsapp,
                photoUrl: a.photoUrl,
                email: a.email,
              }))}
              currentAgent={
                property.agent
                  ? {
                      id: property.agent.id,
                      name: property.agent.name,
                      title: property.agent.title,
                      phone: property.agent.phone,
                      whatsapp: property.agent.whatsapp,
                      photoUrl: property.agent.photoUrl,
                      email: property.agent.email,
                    }
                  : null
              }
            />

            <div className="space-y-3 border-t pt-4">
              <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
                Marketing offers
              </p>
              <PropertyMarketingOffers
                propertyId={property.id}
                cashbackPercent={property.cashbackPercent?.toString() ?? ""}
                virtualTour={(property.virtualTour ?? "") as VirtualTourValue}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="h-auto flex-wrap justify-start gap-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="location">Location</TabsTrigger>
          <TabsTrigger value="amenities">
            Amenities ({property.amenities.length})
          </TabsTrigger>
          <TabsTrigger value="gallery">
            Gallery ({property.images.length})
          </TabsTrigger>
          <TabsTrigger value="sync">Sync</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card className="rounded-[3px]">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-muted-foreground">
              {property.description ||
                property.shortDescription ||
                "No description imported."}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="location">
          <Card className="rounded-[3px]">
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-2 text-sm sm:grid-cols-2">
              {[
                ["Country", property.address?.country],
                ["State", property.address?.state],
                ["City", property.address?.city],
                ["District", property.address?.district],
                ["Locality", property.address?.locality],
                ["Community", property.address?.community],
                ["Sub community", property.address?.subCommunity],
                ["Tower", property.address?.tower],
                ["Latitude", property.address?.latitude?.toString()],
                ["Longitude", property.address?.longitude?.toString()],
                ["Google Place ID", property.address?.googlePlaceId],
              ].map(([label, value]) => (
                <Row key={label as string} label={label as string} value={value ?? "—"} />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amenities">
          <Card className="rounded-[3px]">
            <CardContent className="flex flex-wrap gap-2 pt-6">
              {property.amenities.length === 0 ? (
                <p className="text-sm text-muted-foreground">No amenities.</p>
              ) : (
                property.amenities.map((row) => (
                  <Badge key={row.id} variant="secondary">
                    {row.amenity.name}
                  </Badge>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gallery">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {property.images.map((image) => (
              <div
                key={image.id}
                className="overflow-hidden rounded-[3px] border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image.url}
                  alt={image.alt ?? property.name}
                  className="aspect-[4/3] w-full object-cover"
                />
                <p className="px-2 py-1.5 text-xs text-muted-foreground">
                  {image.galleryKind}
                  {image.isCover ? " · Cover" : ""}
                </p>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="sync">
          <Card className="rounded-[3px]">
            <CardHeader>
              <CardTitle>Sync information</CardTitle>
              <CardDescription>LeadRat import history</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Status" value={property.sync?.status ?? "—"} />
              <Row
                label="Imported"
                value={
                  property.sync?.importedAt
                    ? property.sync.importedAt.toLocaleString()
                    : "—"
                }
              />
              <Row
                label="Last sync"
                value={
                  property.sync?.lastSyncedAt
                    ? property.sync.lastSyncedAt.toLocaleString()
                    : "—"
                }
              />
              <Row
                label="Version"
                value={property.sync?.syncVersion?.toString() ?? "—"}
              />
              {property.sync?.lastError ? (
                <p className="text-destructive">{property.sync.lastError}</p>
              ) : null}
              <div className="pt-2">
                <p className="mb-2 font-medium">Recent logs</p>
                {property.syncLogs.length === 0 ? (
                  <p className="text-muted-foreground">No logs yet.</p>
                ) : (
                  <ul className="space-y-2">
                    {property.syncLogs.map((log) => (
                      <li
                        key={log.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded border px-3 py-2"
                      >
                        <Badge variant="outline">{log.status}</Badge>
                        <span className="text-muted-foreground">
                          {log.createdAt.toLocaleString()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border/60 py-1.5 last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="max-w-[65%] text-right font-medium break-all">{value}</span>
    </div>
  );
}
