import Link from "next/link";

import { isWidgetBlock, type PageBlock } from "@/config/page-content-defaults";
import { LeadCaptureForm } from "@/features/leads/components/lead-capture-form";
import { AgentAvatar } from "@/features/marketing/agent-avatar";
import { PublicBlogCard } from "@/features/marketing/public-blog-card";
import { PublicFaqs } from "@/features/marketing/public-faqs";
import { PublicPropertyCard } from "@/features/marketing/public-property-card";
import {
  PropertiesMap,
  type MapProperty,
} from "@/features/marketing/properties-map";
import { PublicTestimonials } from "@/features/marketing/public-testimonials";
import { StaticPageBlocks } from "@/features/marketing/static-page-blocks";
import { prisma } from "@/lib/db";
import { locationLabel } from "@/lib/location";
import { blockShellClass } from "@/lib/page-block-style";
import { cn } from "@/lib/utils";
import { organizationRepository } from "@/repositories/organization.repository";
import { blogService } from "@/services/blog.service";
import { propertyService } from "@/services/property.service";

function clampLimit(value: number | undefined, fallback: number, max: number) {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, Math.round(n));
}

function compactPrice(value: { toString(): string } | null, currency: string) {
  if (value == null) return null;
  const n = Number(value.toString());
  if (!Number.isFinite(n) || n <= 0) return null;
  const code = currency || "AED";
  if (n >= 1_000_000) {
    const millions = n / 1_000_000;
    const rounded =
      millions >= 10
        ? Math.round(millions).toString()
        : (Math.round(millions * 10) / 10).toString().replace(/\.0$/, "");
    return `${code} ${rounded}M`;
  }
  if (n >= 1_000) return `${code} ${Math.round(n / 1_000)}K`;
  return `${code} ${Math.round(n)}`;
}

function WidgetHeading({ block }: { block: PageBlock }) {
  if (!block.title && !block.body) return null;
  return (
    <div className="mb-8">
      {block.title ? (
        <h2 className="font-display text-3xl md:text-4xl">{block.title}</h2>
      ) : null}
      {block.body ? (
        <p className="mt-3 max-w-[62ch] text-sm leading-relaxed text-slate md:text-base">
          {block.body}
        </p>
      ) : null}
    </div>
  );
}

function WidgetFooter({ block }: { block: PageBlock }) {
  if (!block.buttonLabel) return null;
  const href = block.buttonHref || "/properties";
  return (
    <div className="mt-8">
      <Link
        href={href}
        className="inline-flex items-center text-sm font-semibold text-ink underline-offset-4 hover:text-red hover:underline"
      >
        {block.buttonLabel}
      </Link>
    </div>
  );
}

async function ListingsWidget({ block }: { block: PageBlock }) {
  const limit = clampLimit(block.limit, 6, 24);
  const completion =
    block.completion === "off-plan" || block.completion === "ready"
      ? block.completion
      : undefined;
  const result = await propertyService.listPublished({
    q: block.query?.trim() || undefined,
    featured: block.featuredOnly || undefined,
    completionMode: completion,
    page: 1,
    pageSize: limit,
  });

  if (result.items.length === 0) {
    return (
      <div>
        <WidgetHeading block={block} />
        <p className="text-sm text-slate">
          No published listings match this widget yet.
        </p>
      </div>
    );
  }

  const isList = block.layout === "list";
  return (
    <div>
      <WidgetHeading block={block} />
      <div
        className={cn(
          "grid gap-6",
          isList ? "grid-cols-1" : "sm:grid-cols-2 lg:grid-cols-3",
        )}
      >
        {result.items.map((property) => (
          <PublicPropertyCard key={property.id} property={property} />
        ))}
      </div>
      <WidgetFooter block={block} />
    </div>
  );
}

async function MapWidget({ block }: { block: PageBlock }) {
  const org = await organizationRepository.getDefault();
  if (!org) return null;

  const limit = clampLimit(block.limit, 80, 200);
  const q = block.query?.trim();
  const completion =
    block.completion === "off-plan"
      ? "OFF_PLAN"
      : block.completion === "ready"
        ? "READY"
        : undefined;

  const rows = await prisma.property.findMany({
    where: {
      organizationId: org.id,
      status: "PUBLISHED",
      deletedAt: null,
      address: { latitude: { not: null }, longitude: { not: null } },
      ...(block.featuredOnly ? { isFeatured: true } : {}),
      ...(completion ? { completionStatus: completion } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { community: { name: { contains: q, mode: "insensitive" } } },
              { area: { name: { contains: q, mode: "insensitive" } } },
            ],
          }
        : {}),
    },
    select: {
      id: true,
      slug: true,
      name: true,
      minPrice: true,
      currency: true,
      address: { select: { latitude: true, longitude: true } },
      community: { select: { name: true } },
      area: { select: { name: true } },
      images: {
        where: { deletedAt: null },
        orderBy: [{ isCover: "desc" }, { sortOrder: "asc" }],
        take: 1,
        select: { url: true },
      },
    },
    take: limit,
  });

  const properties: MapProperty[] = rows.flatMap((row) => {
    const lat = row.address?.latitude;
    const lng = row.address?.longitude;
    if (lat == null || lng == null) return [];
    return [
      {
        id: row.id,
        slug: row.slug,
        name: row.name,
        location: locationLabel([row.community?.name, row.area?.name]),
        priceLabel: compactPrice(row.minPrice, row.currency),
        coverUrl: row.images[0]?.url ?? null,
        latitude: lat,
        longitude: lng,
      },
    ];
  });

  return (
    <div>
      <WidgetHeading block={block} />
      <PropertiesMap
        properties={properties}
        className="h-[420px] min-h-[320px] w-full overflow-hidden rounded-[20px] border border-line bg-[#ddd]"
        emptyTitle="Nothing to map yet"
        emptyBody="None of the matching listings have map coordinates."
        emptyHref="/properties/map"
        emptyLabel="Open the full map"
      />
    </div>
  );
}

async function TeamWidget({ block }: { block: PageBlock }) {
  const org = await organizationRepository.getDefault();
  if (!org) return null;
  const limit = clampLimit(block.limit, 8, 24);
  const agents = await prisma.agent.findMany({
    where: { organizationId: org.id, deletedAt: null, isActive: true },
    orderBy: [{ isFeatured: "desc" }, { sortOrder: "asc" }, { name: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      title: true,
      photoUrl: true,
    },
  });

  if (agents.length === 0) return null;

  return (
    <div>
      <WidgetHeading block={block} />
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {agents.map((agent) => {
          const href = agent.slug ? `/our-team/${agent.slug}` : "/our-team";
          return (
            <Link
              key={agent.id}
              href={href}
              className="border border-line bg-white p-5 transition hover:border-ink/30"
            >
              <div className="mx-auto size-20 overflow-hidden rounded-full bg-mist">
                <AgentAvatar
                  name={agent.name}
                  photoUrl={agent.photoUrl}
                  className="h-full w-full object-cover"
                />
              </div>
              <h3 className="mt-4 text-center font-display text-xl">
                {agent.name}
              </h3>
              <p className="mt-1 text-center text-sm text-slate">
                {agent.title || "Property Consultant"}
              </p>
            </Link>
          );
        })}
      </div>
      <WidgetFooter block={block} />
    </div>
  );
}

async function FaqsWidget({ block }: { block: PageBlock }) {
  const org = await organizationRepository.getDefault();
  if (!org) return null;
  const limit = clampLimit(block.limit, 8, 20);
  const faqs = await prisma.faq.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: limit,
    select: { id: true, question: true, answer: true },
  });
  if (faqs.length === 0) return null;
  return (
    <PublicFaqs
      faqs={faqs}
      title={block.title || "Frequently asked questions"}
      eyebrow=""
      embedded
    />
  );
}

async function TestimonialsWidget({ block }: { block: PageBlock }) {
  const org = await organizationRepository.getDefault();
  if (!org) return null;
  const limit = clampLimit(block.limit, 6, 12);
  const items = await prisma.testimonial.findMany({
    where: { organizationId: org.id, deletedAt: null },
    orderBy: [
      { isFeatured: "desc" },
      { sortOrder: "asc" },
      { createdAt: "desc" },
    ],
    take: limit,
  });
  if (items.length === 0) return null;
  return (
    <PublicTestimonials
      title={block.title || "What clients say"}
      eyebrow=""
      embedded
      items={items.map((item) => ({
        id: item.id,
        authorName: item.authorName,
        authorRole: item.authorRole,
        content: item.content,
        rating: item.rating != null ? Number(item.rating) : null,
      }))}
    />
  );
}

async function BlogWidget({ block }: { block: PageBlock }) {
  const org = await organizationRepository.getDefault();
  if (!org) return null;
  const limit = clampLimit(block.limit, 3, 12);
  const result = await blogService.listPublished(org.id, 1, limit);
  if (result.items.length === 0) {
    return (
      <div>
        <WidgetHeading block={block} />
        <p className="text-sm text-slate">No published articles yet.</p>
      </div>
    );
  }
  return (
    <div>
      <WidgetHeading block={block} />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {result.items.map((post) => (
          <PublicBlogCard key={post.id} post={post} />
        ))}
      </div>
      <WidgetFooter block={block} />
    </div>
  );
}

function FormWidget({ block }: { block: PageBlock }) {
  return (
    <div className="border border-line bg-mist p-6 md:p-8">
      <WidgetHeading block={block} />
      <LeadCaptureForm leadSource="page_widget" campaign="page-builder" />
    </div>
  );
}

const LISTABLE = { status: "PUBLISHED" as const, deletedAt: null };

async function AreasWidget({ block }: { block: PageBlock }) {
  const org = await organizationRepository.getDefault();
  if (!org) return null;
  const limit = clampLimit(block.limit, 8, 24);
  const communities = await prisma.community.findMany({
    where: {
      organizationId: org.id,
      deletedAt: null,
      properties: { some: LISTABLE },
    },
    orderBy: { name: "asc" },
    take: limit,
    select: {
      id: true,
      name: true,
      area: { select: { name: true } },
      _count: { select: { properties: { where: LISTABLE } } },
    },
  });
  if (communities.length === 0) return null;
  return (
    <div>
      <WidgetHeading block={block} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {communities.map((item) => (
          <Link
            key={item.id}
            href={`/properties?q=${encodeURIComponent(item.name)}`}
            className="border border-line bg-white px-4 py-4 transition hover:border-ink/30"
          >
            <span className="block font-display text-xl">{item.name}</span>
            <span className="mt-1 block text-xs text-slate">
              {item._count.properties}{" "}
              {item._count.properties === 1 ? "project" : "projects"}
              {item.area?.name ? ` · ${item.area.name}` : ""}
            </span>
          </Link>
        ))}
      </div>
      <WidgetFooter block={block} />
    </div>
  );
}

async function DevelopersWidget({ block }: { block: PageBlock }) {
  const org = await organizationRepository.getDefault();
  if (!org) return null;
  const limit = clampLimit(block.limit, 8, 24);
  const developers = await prisma.developer.findMany({
    where: {
      organizationId: org.id,
      deletedAt: null,
      isPublished: true,
      properties: { some: LISTABLE },
    },
    orderBy: [{ listPriority: "asc" }, { name: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      _count: { select: { properties: { where: LISTABLE } } },
    },
  });
  if (developers.length === 0) return null;
  return (
    <div>
      <WidgetHeading block={block} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {developers.map((item) => (
          <Link
            key={item.id}
            href={`/properties?q=${encodeURIComponent(item.name)}`}
            className="flex items-center gap-3 border border-line bg-white px-4 py-4 transition hover:border-ink/30"
          >
            {item.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.logoUrl}
                alt=""
                className="size-10 object-contain"
              />
            ) : null}
            <span>
              <span className="block font-display text-lg">{item.name}</span>
              <span className="text-xs text-slate">
                {item._count.properties}{" "}
                {item._count.properties === 1 ? "project" : "projects"}
              </span>
            </span>
          </Link>
        ))}
      </div>
      <WidgetFooter block={block} />
    </div>
  );
}

async function PageWidget({ block }: { block: PageBlock }) {
  switch (block.type) {
    case "listings":
      return <ListingsWidget block={block} />;
    case "map":
      return <MapWidget block={block} />;
    case "team":
      return <TeamWidget block={block} />;
    case "faqs":
      return <FaqsWidget block={block} />;
    case "testimonials":
      return <TestimonialsWidget block={block} />;
    case "blog":
      return <BlogWidget block={block} />;
    case "form":
      return <FormWidget block={block} />;
    case "areas":
      return <AreasWidget block={block} />;
    case "developers":
      return <DevelopersWidget block={block} />;
    default:
      return null;
  }
}

export async function PageBuilder({
  blocks,
  className,
}: {
  blocks: PageBlock[];
  className?: string;
}) {
  if (!blocks.length) return null;

  return (
    <div className={cn("space-y-10", className)}>
      {blocks.map((block) => (
        <div key={block.id} className={blockShellClass(block)}>
          {isWidgetBlock(block.type) ? (
            <PageWidget block={block} />
          ) : (
            <StaticPageBlocks blocks={[block]} className="space-y-0" />
          )}
        </div>
      ))}
    </div>
  );
}
