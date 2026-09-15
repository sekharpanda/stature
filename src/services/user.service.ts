import { hashPassword } from "better-auth/crypto";
import { randomBytes } from "crypto";

import { requirePermission } from "@/lib/auth";
import { sendInviteUserEmail } from "@/lib/email/invite";
import { AppError } from "@/lib/errors";
import { prisma } from "@/lib/db";
import { userRepository } from "@/repositories/user.repository";
import {
  deleteUserSchema,
  inviteUserSchema,
  resendInviteSchema,
  setUserRolesSchema,
  updateUserSchema,
  updateUserStatusSchema,
} from "@/schemas/iam.schema";

function generateTemporaryPassword() {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
  const bytes = randomBytes(14);
  let out = "";
  for (let i = 0; i < 14; i += 1) {
    out += alphabet[bytes[i]! % alphabet.length];
  }
  return out;
}

export const userService = {
  async list(
    organizationId: string,
    options?: {
      status?: "ACTIVE" | "INVITED" | "SUSPENDED" | "DISABLED";
      roleSlug?: string;
      q?: string;
    },
  ) {
    await requirePermission("user:manage");
    return userRepository.listByOrganization(organizationId, options);
  },

  async dashboard(organizationId: string) {
    await requirePermission("user:manage");
    return userRepository.getDashboardCounts(organizationId);
  },

  async listRoles(organizationId: string) {
    await requirePermission("user:manage");
    return userRepository.listAssignableRoles(organizationId);
  },

  async invite(raw: unknown) {
    const session = await requirePermission("user:manage");
    const parsed = inviteUserSchema.parse(raw);

    const existing = await userRepository.findByEmail(parsed.email);
    if (existing) {
      throw new AppError("A user with this email already exists", {
        code: "USER_EXISTS",
        status: 409,
      });
    }

    const [role, organization] = await Promise.all([
      prisma.role.findFirst({
        where: {
          id: parsed.roleId,
          deletedAt: null,
          OR: [
            { organizationId: parsed.organizationId },
            { organizationId: null },
          ],
        },
      }),
      prisma.organization.findFirst({
        where: { id: parsed.organizationId, deletedAt: null },
      }),
    ]);

    if (!role) {
      throw new AppError("Role not found", { status: 404 });
    }
    if (!organization) {
      throw new AppError("Organization not found", { status: 404 });
    }

    const temporaryPassword =
      parsed.temporaryPassword?.trim() || generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    const user = await userRepository.createInvitedUser({
      ...parsed,
      temporaryPassword,
      passwordHash,
    });

    try {
      await sendInviteUserEmail({
        to: user.email,
        inviteeName: user.name,
        organizationName: organization.name,
        roleName: role.name,
        roleSlug: role.slug,
        temporaryPassword,
        invitedByName: session.user.name ?? undefined,
      });
    } catch (error) {
      await prisma.user.delete({ where: { id: user.id } }).catch(() => null);
      throw error;
    }

    return user;
  },

  async resendInvite(raw: unknown) {
    const session = await requirePermission("user:manage");
    const parsed = resendInviteSchema.parse(raw);

    const user = await userRepository.findById(parsed.userId);
    if (!user) throw new AppError("User not found", { status: 404 });
    if (!user.organizationId) {
      throw new AppError("User is not linked to an organization", {
        status: 400,
      });
    }

    const organization = await prisma.organization.findFirst({
      where: { id: user.organizationId, deletedAt: null },
    });
    if (!organization) {
      throw new AppError("Organization not found", { status: 404 });
    }

    const roleName = user.userRoles[0]?.role.name ?? "Team member";
    const roleSlug = user.userRoles[0]?.role.slug;
    const temporaryPassword = generateTemporaryPassword();
    const passwordHash = await hashPassword(temporaryPassword);

    await userRepository.setCredentialPassword(user.id, passwordHash);
    if (user.status !== "ACTIVE") {
      await userRepository.updateStatus(user.id, "INVITED");
    }

    await sendInviteUserEmail({
      to: user.email,
      inviteeName: user.name,
      organizationName: organization.name,
      roleName,
      roleSlug,
      temporaryPassword,
      invitedByName: session.user.name ?? undefined,
    });

    return { id: user.id };
  },

  async update(raw: unknown) {
    await requirePermission("user:manage");
    const parsed = updateUserSchema.parse(raw);
    const user = await userRepository.findById(parsed.userId);
    if (!user) throw new AppError("User not found", { status: 404 });

    const nextEmail = parsed.email.trim().toLowerCase();
    if (nextEmail !== user.email.toLowerCase()) {
      const existing = await userRepository.findByEmail(nextEmail);
      if (existing && existing.id !== user.id) {
        throw new AppError("A user with this email already exists", {
          code: "USER_EXISTS",
          status: 409,
        });
      }
    }

    const role = await prisma.role.findFirst({
      where: {
        id: parsed.roleId,
        deletedAt: null,
        OR: [
          { organizationId: user.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (!role) {
      throw new AppError("Role not found", { status: 404 });
    }

    await userRepository.updateProfile({
      userId: parsed.userId,
      name: parsed.name,
      email: nextEmail,
      status: parsed.status,
    });

    if (nextEmail !== user.email.toLowerCase()) {
      await prisma.account.updateMany({
        where: { userId: user.id, providerId: "credential" },
        data: { accountId: nextEmail },
      });
    }

    await userRepository.setRoles(parsed.userId, [parsed.roleId]);

    return userRepository.findById(parsed.userId);
  },

  async delete(raw: unknown) {
    const session = await requirePermission("user:manage");
    const parsed = deleteUserSchema.parse(raw);
    if (session.user.id === parsed.userId) {
      throw new AppError("You cannot delete your own account", {
        code: "CANNOT_DELETE_SELF",
        status: 400,
      });
    }

    const user = await userRepository.findById(parsed.userId);
    if (!user) throw new AppError("User not found", { status: 404 });

    const result = await userRepository.softDelete(parsed.userId);
    if (!result) throw new AppError("User not found", { status: 404 });
    return result;
  },

  async updateStatus(raw: unknown) {
    await requirePermission("user:manage");
    const parsed = updateUserStatusSchema.parse(raw);
    const user = await userRepository.findById(parsed.userId);
    if (!user) throw new AppError("User not found", { status: 404 });
    return userRepository.updateStatus(parsed.userId, parsed.status);
  },

  async setRoles(raw: unknown) {
    await requirePermission("user:manage");
    const parsed = setUserRolesSchema.parse(raw);
    const user = await userRepository.findById(parsed.userId);
    if (!user) throw new AppError("User not found", { status: 404 });

    const roles = await prisma.role.findMany({
      where: {
        id: { in: parsed.roleIds },
        deletedAt: null,
        OR: [
          { organizationId: user.organizationId },
          { organizationId: null },
        ],
      },
    });
    if (roles.length !== parsed.roleIds.length) {
      throw new AppError("One or more roles are invalid", { status: 400 });
    }

    return userRepository.setRoles(parsed.userId, parsed.roleIds);
  },
};
