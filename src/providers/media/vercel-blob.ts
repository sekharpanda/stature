import { del, put } from "@vercel/blob";

import { AppError } from "@/lib/errors";
import type {
  MediaStorageProvider,
  MediaUploadInput,
  MediaUploadResult,
} from "./types";

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

async function toBuffer(body: MediaUploadInput["body"]) {
  if (Buffer.isBuffer(body)) return body;
  if (body instanceof Uint8Array) return Buffer.from(body);
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map((chunk) => Buffer.from(chunk)));
}

/**
 * Durable uploads for Vercel. Local disk under public/uploads does not
 * survive deploys, so production must use Blob once the token is present.
 */
export class VercelBlobMediaStorageProvider implements MediaStorageProvider {
  readonly name = "vercel-blob";

  async upload(input: MediaUploadInput): Promise<MediaUploadResult> {
    if (!process.env.BLOB_READ_WRITE_TOKEN?.trim()) {
      throw new AppError(
        "Photo uploads on the hosted site need a Vercel Blob store. Connect Blob in the Vercel project so BLOB_READ_WRITE_TOKEN is set.",
        { code: "MEDIA_NOT_CONFIGURED", status: 503 },
      );
    }

    const folder = input.folder?.replace(/[^a-zA-Z0-9/_-]/g, "") || "properties";
    const safeName = sanitizeFilename(input.filename || "upload.bin");
    const pathname = `org/${input.organizationId}/${folder}/${safeName}`;
    const body = await toBuffer(input.body);

    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: true,
      contentType: input.mimeType,
    });

    return {
      storageKey: blob.url,
      url: blob.url,
      sizeBytes: body.byteLength,
    };
  }

  async delete(storageKey: string): Promise<void> {
    if (!storageKey.startsWith("http")) return;
    try {
      await del(storageKey);
    } catch {
      // ignore missing
    }
  }

  async getUrl(storageKey: string): Promise<string> {
    return storageKey;
  }
}

export const vercelBlobMediaStorage = new VercelBlobMediaStorageProvider();
