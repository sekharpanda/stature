/**
 * Read-only audit: confirms the portal schema, permissions and role mapping
 * actually landed in the database, so nobody has to guess whether a sync ran.
 */
import { config } from "dotenv";

config({ path: ".env.local" });
config({ path: ".env" });

import { PrismaClient } from "@prisma/client";

const PORTAL_KEYS = [
  "portal:access",
  "portal:profile",
  "portal:property",
  "portal:blog",
  "submission:review",
];

/**
 * A suspended Neon compute takes longer to wake than Prisma's 5s default, which
 * looks like an unreachable server from a one-shot script.
 */
function datasourceUrl() {
  const raw = process.env.DATABASE_URL;
  if (!raw) throw new Error("DATABASE_URL is not set");
  try {
    const url = new URL(raw);
    url.searchParams.set("connect_timeout", "60");
    url.searchParams.set("pool_timeout", "60");
    return url.toString();
  } catch {
    return raw;
  }
}

async function main() {
  const prisma = new PrismaClient({
    datasources: { db: { url: datasourceUrl() } },
  });
  try {
    const submissions = await prisma.contentSubmission.count();
    console.log(`content_submissions table: OK (${submissions} rows)`);

    const permissions = await prisma.permission.findMany({
      where: { key: { in: PORTAL_KEYS } },
      select: { key: true },
    });
    const present = new Set(permissions.map((row) => row.key));
    for (const key of PORTAL_KEYS) {
      console.log(`permission ${key}: ${present.has(key) ? "OK" : "MISSING"}`);
    }

    const roles = await prisma.role.findMany({
      where: { slug: { in: ["sales_agent", "super_admin", "admin"] } },
      select: {
        slug: true,
        rolePermissions: {
          where: { deletedAt: null },
          select: { permission: { select: { key: true } } },
        },
      },
    });

    for (const role of roles) {
      const keys = role.rolePermissions.map((row) => row.permission.key);
      // Only super_admin reviews submissions; plain admin is intentionally left out.
      const expected =
        role.slug === "sales_agent"
          ? PORTAL_KEYS.filter((key) => key !== "submission:review")
          : role.slug === "super_admin"
            ? ["submission:review"]
            : [];
      const missing = expected.filter((key) => !keys.includes(key));
      console.log(
        `role ${role.slug}: ${keys.length} permissions, ${
          missing.length === 0 ? "portal mapping OK" : `MISSING ${missing.join(", ")}`
        }`,
      );
    }

    const linked = await prisma.agent.count({
      where: { userId: { not: null }, deletedAt: null },
    });
    console.log(`agents with a linked login: ${linked}`);

    const pending = await prisma.contentSubmission.findMany({
      where: { status: "PENDING", deletedAt: null },
      select: { entityType: true, kind: true, title: true, submittedAt: true },
      orderBy: { submittedAt: "desc" },
    });
    console.log(`pending submissions: ${pending.length}`);
    for (const row of pending) {
      console.log(`  - [${row.entityType}/${row.kind}] ${row.title}`);
    }

    const testUsers = await prisma.user.findMany({
      where: { email: { startsWith: "portal.test" } },
      select: {
        id: true,
        email: true,
        status: true,
        userRoles: {
          where: { deletedAt: null },
          select: { role: { select: { slug: true } } },
        },
      },
    });
    for (const user of testUsers) {
      const roles = user.userRoles.map((row) => row.role.slug).join(", ") || "none";
      // A session row here would mean sign-up still logs people in.
      const sessions = await prisma.session.count({ where: { userId: user.id } });
      console.log(
        `test user ${user.email}: status=${user.status}, roles=${roles}, sessions=${sessions}`,
      );
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
