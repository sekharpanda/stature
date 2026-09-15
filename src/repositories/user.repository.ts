import type { Prisma, UserStatus } from "@prisma/client";

import { prisma } from "@/lib/db";
import type { InviteUserInput } from "@/schemas/iam.schema";

export const userRepository = {
  async listByOrganization(
    organizationId: string,
    options?: {
      status?: UserStatus;
      roleSlug?: string;
      q?: string;
      take?: number;
    },
  ) {
    const take = options?.take ?? 100;
    const q = options?.q?.trim();

    return prisma.user.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(options?.status ? { status: options.status } : {}),
        ...(options?.roleSlug
          ? {
              userRoles: {
                some: {
                  deletedAt: null,
                  role: { slug: options.roleSlug, deletedAt: null },
                },
              },
            }
          : {}),
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      include: {
        userRoles: {
          where: { deletedAt: null },
          include: { role: true },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: [{ status: "asc" }, { name: "asc" }],
      take,
    });
  },

  async getDashboardCounts(organizationId: string) {
    const [total, active, invited, suspended, disabled] = await Promise.all([
      prisma.user.count({ where: { organizationId, deletedAt: null } }),
      prisma.user.count({
        where: { organizationId, deletedAt: null, status: "ACTIVE" },
      }),
      prisma.user.count({
        where: { organizationId, deletedAt: null, status: "INVITED" },
      }),
      prisma.user.count({
        where: { organizationId, deletedAt: null, status: "SUSPENDED" },
      }),
      prisma.user.count({
        where: { organizationId, deletedAt: null, status: "DISABLED" },
      }),
    ]);
    return { total, active, invited, suspended, disabled };
  },

  async findByEmail(email: string) {
    return prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" }, deletedAt: null },
    });
  },

  async findById(id: string) {
    return prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        userRoles: {
          where: { deletedAt: null },
          include: { role: true },
        },
      },
    });
  },

  async createInvitedUser(
    input: InviteUserInput & { passwordHash: string },
  ) {
    return prisma.user.create({
      data: {
        organizationId: input.organizationId,
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        emailVerified: false,
        status: input.status ?? "INVITED",
        accounts: {
          create: {
            accountId: input.email.trim().toLowerCase(),
            providerId: "credential",
            password: input.passwordHash,
          },
        },
        userRoles: {
          create: {
            roleId: input.roleId,
          },
        },
      },
      include: {
        userRoles: { include: { role: true } },
      },
    });
  },

  async updateStatus(userId: string, status: UserStatus) {
    return prisma.user.update({
      where: { id: userId },
      data: { status },
    });
  },

  async setRoles(userId: string, roleIds: string[]) {
    await prisma.$transaction(async (tx) => {
      await tx.userRole.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      for (const roleId of roleIds) {
        const existing = await tx.userRole.findFirst({
          where: { userId, roleId },
        });
        if (existing) {
          await tx.userRole.update({
            where: { id: existing.id },
            data: { deletedAt: null },
          });
        } else {
          await tx.userRole.create({
            data: { userId, roleId },
          });
        }
      }
    });
    return this.findById(userId);
  },

  async setCredentialPassword(userId: string, passwordHash: string) {
    const account = await prisma.account.findFirst({
      where: { userId, providerId: "credential" },
    });
    if (!account) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) return null;
      return prisma.account.create({
        data: {
          userId,
          accountId: user.email,
          providerId: "credential",
          password: passwordHash,
        },
      });
    }
    return prisma.account.update({
      where: { id: account.id },
      data: { password: passwordHash },
    });
  },

  async updateProfile(input: {
    userId: string;
    name: string;
    email: string;
    status: UserStatus;
  }) {
    return prisma.user.update({
      where: { id: input.userId },
      data: {
        name: input.name.trim(),
        email: input.email.trim().toLowerCase(),
        status: input.status,
      },
    });
  },

  async softDelete(userId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
    });
    if (!user) return null;

    const tombstoneEmail = `deleted+${userId}@deleted.local`;
    await prisma.$transaction(async (tx) => {
      await tx.session.deleteMany({ where: { userId } });
      await tx.userRole.updateMany({
        where: { userId, deletedAt: null },
        data: { deletedAt: new Date() },
      });
      await tx.account.updateMany({
        where: { userId, providerId: "credential" },
        data: { accountId: tombstoneEmail },
      });
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          status: "DISABLED",
          email: tombstoneEmail,
          emailVerified: false,
        },
      });
    });
    return { id: userId };
  },

  async listAssignableRoles(organizationId: string) {
    return prisma.role.findMany({
      where: {
        deletedAt: null,
        OR: [{ organizationId }, { organizationId: null }],
      },
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });
  },
};

export type ListedUser = Prisma.UserGetPayload<{
  include: {
    userRoles: { include: { role: true } };
  };
}>;
