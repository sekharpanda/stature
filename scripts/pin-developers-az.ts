/**
 * Pin the A–Z developer list in order. Creates missing developer records.
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";

import {
  computeListPriority,
  DEFAULT_LIST_PRIORITY,
} from "../src/config/priority-developers";
import { slugify } from "../src/lib/utils";

const prisma = new PrismaClient();

const ORDER = [
  "AG",
  "Aark",
  "ALA",
  "Al Fulaiti",
  "Al Waleed",
  "Deniz",
  "Dugasta",
  "Enaam",
  "Empire",
  "GFS",
  "Grovy",
  "Gutti",
  "HMB",
  "HRE",
  "HZ",
  "Imtiaz",
  "Karma",
  "Leos",
  "Marquis",
  "Mashriq Elite",
  "Mr Eight",
  "Object 1",
  "Peace Homes",
  "Pearlshire",
  "Prestige One",
  "Reef",
  "Samana",
  "Saray",
  "Tarrad",
  "Wadan",
] as const;

const ALIASES: Record<string, string[]> = {
  AG: ["ag development", "ag developers", "ag properties", "^ag$"],
  Aark: ["aark"],
  ALA: ["ala development", "ala developers", "ala properties", "^ala$"],
  "Al Fulaiti": ["fulaiti"],
  "Al Waleed": ["al waleed", "alwaleed"],
  Deniz: ["deniz"],
  Dugasta: ["dugasta"],
  Enaam: ["enaam"],
  Empire: ["empire development", "empire developers", "empire properties"],
  GFS: ["gfs"],
  Grovy: ["grovy"],
  Gutti: ["gutti"],
  HMB: ["hmb"],
  HRE: ["hre development", "hre developers", "hre properties", "^hre$"],
  HZ: ["hz development", "hz developers", "hz properties", "^hz$"],
  Imtiaz: ["imtiaz"],
  Karma: ["karma"],
  Leos: ["leos"],
  Marquis: ["marquis"],
  "Mashriq Elite": ["mashriq"],
  "Mr Eight": ["mr eight", "mr. eight"],
  "Object 1": ["object 1", "object1"],
  "Peace Homes": ["peace homes", "peace home"],
  Pearlshire: ["pearlshire"],
  "Prestige One": ["prestige one"],
  Reef: ["reef development", "reef developers", "reef properties"],
  Samana: ["samana"],
  Saray: ["saray"],
  Tarrad: ["tarrad"],
  Wadan: ["wadan"],
};

/** Prefer exact / stronger catalog names when matching. */
const PREFERRED_NAMES: Record<string, string[]> = {
  "Al Fulaiti": ["Alfulaiti Development", "Al Fulaiti"],
  "Mr Eight": ["Mr. Eight Development", "Mr Eight"],
  HMB: ["HMB Homes Real Estate Development", "HMB"],
  "Peace Homes": ["Peace Homes Development", "Peace Homes"],
  "Prestige One": ["Prestige One Developments", "Prestige One"],
  Grovy: ["Grovy Developers", "Grovy"],
  Imtiaz: ["Imtiaz Development", "Imtiaz"],
  Wadan: ["WADAN Developments", "Wadan"],
  Saray: ["Unique Saray", "Saray"],
  "Object 1": ["Object 1"],
  Samana: ["Samana"],
  Leos: ["Leos"],
};

function matchesLabel(devName: string, label: string): boolean {
  const name = devName.toLowerCase();
  const aliases = ALIASES[label] ?? [label.toLowerCase()];
  return aliases.some((a) => {
    if (a.startsWith("^") && a.endsWith("$")) {
      return name === a.slice(1, -1);
    }
    return name.includes(a.toLowerCase());
  });
}

async function uniqueSlug(organizationId: string, base: string) {
  const slug = slugify(base) || "developer";
  let n = 0;
  while (true) {
    const candidate = n === 0 ? slug : `${slug}-${n}`;
    const existing = await prisma.developer.findFirst({
      where: { organizationId, slug: candidate },
      select: { id: true },
    });
    if (!existing) return candidate;
    n += 1;
  }
}

async function main() {
  const org = await prisma.organization.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (!org) throw new Error("No organization");

  const developers = await prisma.developer.findMany({
    where: { organizationId: org.id, deletedAt: null },
    select: { id: true, name: true },
  });

  const used = new Set<string>();
  const pinned: { label: string; id: string; name: string; created: boolean }[] =
    [];
  const createdLabels: string[] = [];

  for (let index = 0; index < ORDER.length; index++) {
    const label = ORDER[index]!;
    const preferred = PREFERRED_NAMES[label] ?? [];

    let hit =
      developers.find(
        (d) =>
          !used.has(d.id) &&
          preferred.some((p) => d.name.toLowerCase() === p.toLowerCase()),
      ) ??
      developers.find((d) => !used.has(d.id) && matchesLabel(d.name, label));

    let created = false;
    if (!hit) {
      const slug = await uniqueSlug(org.id, label);
      const row = await prisma.developer.create({
        data: {
          organizationId: org.id,
          name: label,
          slug,
          source: "MANUAL",
          isPublished: true,
          listPriority: index,
        },
      });
      hit = { id: row.id, name: row.name };
      developers.push(hit);
      created = true;
      createdLabels.push(label);
    } else {
      await prisma.developer.update({
        where: { id: hit.id },
        data: { listPriority: index },
      });
    }

    used.add(hit.id);
    pinned.push({ label, id: hit.id, name: hit.name, created });
  }

  const unpin = developers.filter((d) => !used.has(d.id)).map((d) => d.id);
  if (unpin.length) {
    await prisma.developer.updateMany({
      where: { id: { in: unpin }, organizationId: org.id },
      data: { listPriority: DEFAULT_LIST_PRIORITY },
    });
  }

  let skip = 0;
  let propUpdated = 0;
  for (;;) {
    const rows = await prisma.property.findMany({
      where: { organizationId: org.id, deletedAt: null },
      select: {
        id: true,
        name: true,
        listPriority: true,
        developer: { select: { name: true, listPriority: true } },
      },
      orderBy: { id: "asc" },
      skip,
      take: 200,
    });
    if (!rows.length) break;
    for (const row of rows) {
      const next = computeListPriority(
        row.name,
        row.developer?.name,
        row.developer?.listPriority,
      );
      if (next !== row.listPriority) {
        await prisma.property.update({
          where: { id: row.id },
          data: { listPriority: next },
        });
        propUpdated += 1;
      }
    }
    skip += rows.length;
  }

  console.log(
    JSON.stringify(
      {
        pinnedCount: pinned.length,
        pinned: pinned.map(
          (r, i) =>
            `${i + 1}. ${r.label} → ${r.name}${r.created ? " (created)" : ""}`,
        ),
        createdLabels,
        unpinnedOthers: unpin.length,
        propUpdated,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
