/**
 * Print Strapi blog attribute keys using token stored on ApiSource (no token logged).
 */
import { readFileSync, existsSync } from "fs";
import { resolve } from "path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] == null || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

loadEnvLocal();

async function main() {
  const { prisma } = await import("../src/lib/db/prisma");

const source = await prisma.apiSource.findFirst({
  where: {
    deletedAt: null,
    name: { contains: "Strapi", mode: "insensitive" },
    authValue: { not: null },
  },
  select: { authValue: true },
});

const token = source?.authValue?.trim() || process.env.STRAPI_API_TOKEN?.trim();
if (!token) {
  console.error("No Strapi token on ApiSource or STRAPI_API_TOKEN env.");
  process.exit(1);
}

const url =
  "https://prowin.propphy.com/api/blogs?populate=*&pagination[pageSize]=1&locale=en";

const res = await fetch(url, {
  headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
});
const text = await res.text();
if (!res.ok) {
  console.error("HTTP", res.status, text.slice(0, 300));
  process.exit(1);
}

const json = JSON.parse(text) as {
  data?: Array<{ id?: number; attributes?: Record<string, unknown> }>;
};
const item = json.data?.[0];
if (!item) {
  console.error("No posts in response");
  process.exit(1);
}

const attrs = item.attributes ?? {};
console.log("Post id:", item.id);
console.log("Attribute keys:", Object.keys(attrs).sort().join(", "));
console.log("\nSample values (truncated):");
for (const [key, value] of Object.entries(attrs)) {
  let preview: string;
  if (value == null) preview = "null";
  else if (typeof value === "string") preview = value.slice(0, 120);
  else if (typeof value === "object") {
    const o = value as Record<string, unknown>;
    if (o.data && typeof o.data === "object") {
      const d = o.data as Record<string, unknown>;
      const a = (d.attributes as Record<string, unknown>) || {};
      preview = `[media url=${String(a.url || "").slice(0, 80)}]`;
    } else preview = JSON.stringify(value).slice(0, 160);
  } else preview = String(value);
  console.log(`  ${key}: ${preview}`);
}

await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
