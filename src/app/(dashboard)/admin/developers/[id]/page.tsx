import Link from "next/link";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { prisma } from "@/lib/db";
import { organizationRepository } from "@/repositories/organization.repository";

export const metadata = {
  title: "Developer",
  robots: { index: false, follow: false },
};

export default async function AdminDeveloperDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const org = await organizationRepository.getDefault();
  if (!org) return <p className="text-muted-foreground">Organization not seeded.</p>;

  const developer = await prisma.developer.findFirst({
    where: { id, organizationId: org.id, deletedAt: null },
    include: {
      _count: { select: { properties: { where: { deletedAt: null } } } },
    },
  });
  if (!developer) notFound();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="mt-2 font-display text-3xl md:text-4xl">
            {developer.name}
          </h1>
          <p className="mt-2 text-muted-foreground">/{developer.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href="/admin/developers">All developers</Link>
          </Button>
          <Button asChild>
            <Link href="/admin/developers/new">Add another</Link>
          </Button>
        </div>
      </div>

      <Card className="card-elevated border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Profile</CardTitle>
          <CardDescription>Developer catalog record</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm md:grid-cols-2">
          <div>
            <p className="text-muted-foreground">Status</p>
            <Badge variant="outline">
              {developer.isPublished ? "Published" : "Hidden"}
            </Badge>
          </div>
          <div>
            <p className="text-muted-foreground">Properties</p>
            <p className="font-medium">{developer._count.properties}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Website</p>
            <p className="font-medium">{developer.website || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Headquarters</p>
            <p className="font-medium">{developer.headquarters || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{developer.email || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Phone</p>
            <p className="font-medium">{developer.phone || "—"}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-muted-foreground">Short description</p>
            <p className="mt-1">{developer.shortDescription || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Meta title</p>
            <p className="font-medium">{developer.metaTitle || "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Meta description</p>
            <p className="font-medium">{developer.metaDescription || "—"}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
