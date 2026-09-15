/**
 * Media storage adapter — local/blob/R2 swappable without changing callers.
 */

import { mkdir, writeFile, unlink } from "node:fs/promises";
import path from "node:path";

export interface MediaUploadInput {
  organizationId: string;
  filename: string;
  mimeType: string;
  body: Buffer | Uint8Array | ReadableStream;
  folder?: string;
}

export interface MediaUploadResult {
  storageKey: string;
  url: string;
  sizeBytes: number;
}

export interface MediaStorageProvider {
  readonly name: string;
  upload(input: MediaUploadInput): Promise<MediaUploadResult>;
  delete(storageKey: string): Promise<void>;
  getUrl(storageKey: string): Promise<string>;
}

function sanitizeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120);
}

export class LocalMediaStorageProvider implements MediaStorageProvider {
  readonly name = "local";

  async upload(input: MediaUploadInput): Promise<MediaUploadResult> {
    const folder = input.folder?.replace(/[^a-zA-Z0-9/_-]/g, "") || "properties";
    const safeName = sanitizeFilename(input.filename || "upload.bin");
    const storageKey = `org/${input.organizationId}/${folder}/${Date.now()}-${safeName}`;
    const abs = path.join(process.cwd(), "public", "uploads", storageKey);
    await mkdir(path.dirname(abs), { recursive: true });

    let body: Buffer;
    if (Buffer.isBuffer(input.body)) {
      body = input.body;
    } else if (input.body instanceof Uint8Array) {
      body = Buffer.from(input.body);
    } else {
      const reader = input.body.getReader();
      const chunks: Uint8Array[] = [];
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value);
      }
      body = Buffer.concat(chunks.map((c) => Buffer.from(c)));
    }

    await writeFile(abs, body);
    return {
      storageKey,
      url: `/uploads/${storageKey}`,
      sizeBytes: body.byteLength,
    };
  }

  async delete(storageKey: string): Promise<void> {
    const abs = path.join(process.cwd(), "public", "uploads", storageKey);
    try {
      await unlink(abs);
    } catch {
      // ignore missing
    }
  }

  async getUrl(storageKey: string): Promise<string> {
    return `/uploads/${storageKey}`;
  }
}

export const localMediaStorage = new LocalMediaStorageProvider();
