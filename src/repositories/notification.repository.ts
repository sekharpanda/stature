import type { NotificationType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";

export const notificationRepository = {
  /** userId null makes it an org-wide notice in the admin bell. */
  async create(data: {
    organizationId: string;
    userId?: string | null;
    type: NotificationType;
    title: string;
    body?: string | null;
    href?: string | null;
    metadata?: Prisma.InputJsonValue;
  }) {
    return prisma.notification.create({
      data: {
        organizationId: data.organizationId,
        userId: data.userId ?? null,
        type: data.type,
        title: data.title,
        body: data.body ?? null,
        href: data.href ?? null,
        metadata: data.metadata,
      },
    });
  },

  async list(organizationId: string, take = 100) {
    return prisma.notification.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  },

  async listRecent(organizationId: string, take = 12) {
    return prisma.notification.findMany({
      where: { organizationId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async listRecentForUser(userId: string, take = 12) {
    return prisma.notification.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take,
    });
  },

  async countUnreadForUser(userId: string) {
    return prisma.notification.count({
      where: { userId, deletedAt: null, isRead: false },
    });
  },

  async countUnread(organizationId: string) {
    return prisma.notification.count({
      where: { organizationId, deletedAt: null, isRead: false },
    });
  },

  async markRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  },

  async markAllRead(organizationId: string) {
    return prisma.notification.updateMany({
      where: { organizationId, isRead: false, deletedAt: null },
      data: { isRead: true, readAt: new Date() },
    });
  },
};
