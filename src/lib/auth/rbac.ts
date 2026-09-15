import type { PermissionKey } from "@/constants/permissions";
import { ForbiddenError, UnauthorizedError } from "@/lib/errors";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * RBAC helper — call from services / server actions.
 * Phase 0: loads permissions via user → roles → rolePermissions.
 */
export async function requirePermission(permission: PermissionKey) {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new UnauthorizedError();
  }

  const userRoles = await prisma.userRole.findMany({
    where: { userId: session.user.id, deletedAt: null },
    include: {
      role: {
        include: {
          rolePermissions: {
            where: { deletedAt: null },
            include: { permission: true },
          },
        },
      },
    },
  });

  const keys = new Set(
    userRoles.flatMap((ur) =>
      ur.role.rolePermissions.map((rp) => rp.permission.key),
    ),
  );

  if (!keys.has(permission)) {
    throw new ForbiddenError(`Missing permission: ${permission}`);
  }

  return session;
}

/**
 * Roles are the gate for reaching the dashboard at all: a freshly registered
 * account has none, and must stay out until someone approves it.
 */
export async function getUserRoleSlugs(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId, deletedAt: null },
    include: { role: { select: { slug: true, deletedAt: true } } },
  });

  return [
    ...new Set(
      userRoles
        .filter((ur) => !ur.role.deletedAt)
        .map((ur) => ur.role.slug),
    ),
  ];
}

export async function getUserPermissionKeys(userId: string): Promise<string[]> {
  const userRoles = await prisma.userRole.findMany({
    where: { userId, deletedAt: null },
    include: {
      role: {
        include: {
          rolePermissions: {
            where: { deletedAt: null },
            include: { permission: true },
          },
        },
      },
    },
  });

  return [
    ...new Set(
      userRoles.flatMap((ur) =>
        ur.role.rolePermissions.map((rp) => rp.permission.key),
      ),
    ),
  ];
}
