import { requirePermission } from "@/lib/auth";
import { AppError } from "@/lib/errors";
import { getMediaStorage } from "@/providers/media";
import { mediaRepository } from "@/repositories/media.repository";
import type { MediaType } from "@prisma/client";

function detectType(mimeType: string): MediaType {
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType === "application/pdf") return "PDF";
  return "DOCUMENT";
}

export const mediaService = {
  async upload(input: {
    organizationId: string;
    folderId?: string | null;
    file: {
      name: string;
      mimeType: string;
      sizeBytes: number;
      body: Buffer | Uint8Array;
    };
    alt?: string | null;
    title?: string | null;
  }) {
    await requirePermission("media:upload");

    if (!input.file.sizeBytes || input.file.sizeBytes <= 0) {
      throw new AppError("Empty file", { code: "VALIDATION_ERROR", status: 422 });
    }

    const uploaded = await getMediaStorage().upload({
      organizationId: input.organizationId,
      filename: input.file.name,
      mimeType: input.file.mimeType,
      body: input.file.body,
    });

    return mediaRepository.createAsset({
      organizationId: input.organizationId,
      folderId: input.folderId,
      type: detectType(input.file.mimeType),
      filename: uploaded.storageKey.split("/").pop() ?? input.file.name,
      originalName: input.file.name,
      mimeType: input.file.mimeType,
      sizeBytes: input.file.sizeBytes,
      storageKey: uploaded.storageKey,
      url: uploaded.url,
      alt: input.alt,
      title: input.title,
    });
  },

  async createFolder(organizationId: string, name: string, parentId?: string | null) {
    await requirePermission("media:upload");
    return mediaRepository.createFolder(organizationId, name, parentId);
  },

  async list(organizationId: string, folderId?: string | null) {
    await requirePermission("media:read");
    return mediaRepository.listAssets(organizationId, folderId);
  },

  async search(organizationId: string, query: string) {
    await requirePermission("media:read");
    return mediaRepository.searchAssets(organizationId, query);
  },

  async remove(id: string) {
    await requirePermission("media:delete");
    return mediaRepository.softDeleteAsset(id);
  },
};
