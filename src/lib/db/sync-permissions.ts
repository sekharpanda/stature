import type { PrismaClient } from "@prisma/client";

import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  ROLE_SLUGS,
  type PermissionKey,
  type RoleSlug,
} from "@/constants/permissions";

export type RoleSyncOutcome = {
  slug: RoleSlug;
  granted: string[];
  revoked: string[];
};

function roleName(slug: string) {
  return slug
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Makes the database match the permission catalog in code, in both directions:
 * new keys are granted and keys dropped from a role are revoked, so tightening
 * a role actually takes effect for users who already hold it.
 */
export async function syncPermissionsAndRoles(
  client: PrismaClient,
  organizationId: string,
): Promise<RoleSyncOutcome[]> {
  for (const [key, meta] of Object.entries(PERMISSIONS)) {
    await client.permission.upsert({
      where: { key },
      update: { group: meta.group, description: meta.description, deletedAt: null },
      create: { key, group: meta.group, description: meta.description },
    });
  }

  const permissions = await client.permission.findMany({
    select: { id: true, key: true },
  });
  const idByKey = new Map(permissions.map((row) => [row.key, row.id]));
  const keyById = new Map(permissions.map((row) => [row.id, row.key]));

  const outcomes: RoleSyncOutcome[] = [];

  for (const slug of Object.values(ROLE_SLUGS)) {
    const role = await client.role.upsert({
      where: { organizationId_slug: { organizationId, slug } },
      update: { isSystem: true, deletedAt: null },
      create: {
        organizationId,
        name: roleName(slug),
        slug,
        isSystem: true,
        description: `System role: ${slug}`,
      },
    });

    const desired = new Set(
      (ROLE_PERMISSIONS[slug] as PermissionKey[])
        .map((key) => idByKey.get(key))
        .filter((id): id is string => Boolean(id)),
    );

    const existing = await client.rolePermission.findMany({
      where: { roleId: role.id },
      select: { id: true, permissionId: true, deletedAt: true },
    });

    const granted: string[] = [];
    const revoked: string[] = [];

    for (const row of existing) {
      const shouldHave = desired.has(row.permissionId);
      if (shouldHave && row.deletedAt) {
        await client.rolePermission.update({
          where: { id: row.id },
          data: { deletedAt: null },
        });
        granted.push(keyById.get(row.permissionId) ?? row.permissionId);
      }
      if (!shouldHave && !row.deletedAt) {
        await client.rolePermission.update({
          where: { id: row.id },
          data: { deletedAt: new Date() },
        });
        revoked.push(keyById.get(row.permissionId) ?? row.permissionId);
      }
      desired.delete(row.permissionId);
    }

    for (const permissionId of desired) {
      await client.rolePermission.create({ data: { roleId: role.id, permissionId } });
      granted.push(keyById.get(permissionId) ?? permissionId);
    }

    outcomes.push({ slug, granted, revoked });
  }

  return outcomes;
}
