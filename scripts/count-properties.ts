import { PrismaClient } from "@prisma/client";

function datasourceUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL missing");
  try {
    const url = new URL(raw);
    if (!url.searchParams.has("pgbouncer")) url.searchParams.set("pgbouncer", "true");
    if (!url.searchParams.has("connection_limit")) url.searchParams.set("connection_limit", "2");
    if (!url.searchParams.has("connect_timeout")) url.searchParams.set("connect_timeout", "20");
    return url.toString();
  } catch {
    return raw;
  }
}

const prisma = new PrismaClient({
  datasources: { db: { url: datasourceUrl() } },
});

async function main() {
  const base = { deletedAt: null };
  const [
    all,
    pub,
    draft,
    archived,
    expired,
    deleted,
    pubImg,
    pubNoImg,
    leadrat,
    manual,
    featured,
    statuses,
    readyImg,
    offplanImg,
  ] = await Promise.all([
    prisma.property.count({ where: base }),
    prisma.property.count({ where: { ...base, status: "PUBLISHED" } }),
    prisma.property.count({ where: { ...base, status: "DRAFT" } }),
    prisma.property.count({ where: { ...base, status: "ARCHIVED" } }),
    prisma.property.count({ where: { ...base, status: "EXPIRED" } }),
    prisma.property.count({ where: { deletedAt: { not: null } } }),
    prisma.property.count({
      where: {
        ...base,
        status: "PUBLISHED",
        images: { some: { deletedAt: null } },
      },
    }),
    prisma.property.count({
      where: {
        ...base,
        status: "PUBLISHED",
        images: { none: { deletedAt: null } },
      },
    }),
    prisma.property.count({ where: { ...base, source: "LEADRAT" } }),
    prisma.property.count({ where: { ...base, source: "MANUAL" } }),
    prisma.property.count({ where: { ...base, isFeatured: true } }),
    prisma.property.groupBy({
      by: ["status", "source"],
      where: base,
      _count: true,
    }),
    prisma.property.count({
      where: {
        ...base,
        status: "PUBLISHED",
        images: { some: { deletedAt: null } },
        OR: [
          { completionStatus: "READY" },
          { constructionStatus: { contains: "ready", mode: "insensitive" } },
          { constructionStatus: { contains: "completed", mode: "insensitive" } },
        ],
      },
    }),
    prisma.property.count({
      where: {
        ...base,
        status: "PUBLISHED",
        images: { some: { deletedAt: null } },
        NOT: {
          OR: [
            { completionStatus: "READY" },
            { constructionStatus: { contains: "ready", mode: "insensitive" } },
            { constructionStatus: { contains: "completed", mode: "insensitive" } },
          ],
        },
      },
    }),
  ]);

  console.log(
    JSON.stringify(
      {
        all,
        pub,
        draft,
        archived,
        expired,
        deleted,
        pubImg,
        pubNoImg,
        leadrat,
        manual,
        featured,
        statuses,
        readyImg,
        offplanImg,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e instanceof Error ? e.message : e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
