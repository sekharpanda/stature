import { prisma } from "@/lib/db";
import type { MediaType } from "@prisma/client";

export const mediaRepository = {
  async createAsset(input: {
    organizationId: string;
    folderId?: string | null;
    type: MediaType;
    filename: string;
    originalName: string;
    mimeType: string;
    sizeBytes: number;
    storageKey: string;
    url: string;
    width?: number | null;
    height?: number | null;
    alt?: string | null;
    title?: string | null;
    checksum?: string | null;
  }) {
    return prisma.mediaAsset.create({
      data: {
        ...input,
        folderId: input.folderId ?? null,
      },
    });
  },

  async createFolder(organizationId: string, name: string, parentId?: string | null) {
    return prisma.mediaFolder.create({
      data: {
        organizationId,
        name,
        parentId: parentId ?? null,
      },
    });
  },

  async listAssets(organizationId: string, folderId?: string | null) {
    return prisma.mediaAsset.findMany({
      where: {
        organizationId,
        deletedAt: null,
        ...(folderId === undefined ? {} : { folderId }),
      },
      orderBy: { createdAt: "desc" },
      include: {
        tags: { where: { deletedAt: null } },
        versions: { where: { deletedAt: null }, orderBy: { version: "desc" } },
      },
    });
  },

  async searchAssets(organizationId: string, query: string) {
    return prisma.mediaAsset.findMany({
      where: {
        organizationId,
        deletedAt: null,
        OR: [
          { originalName: { contains: query, mode: "insensitive" } },
          { title: { contains: query, mode: "insensitive" } },
          { alt: { contains: query, mode: "insensitive" } },
          { tags: { some: { tag: { contains: query, mode: "insensitive" }, deletedAt: null } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });
  },

  async softDeleteAsset(id: string) {
    return prisma.mediaAsset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
