import { AppError } from "@/lib/errors";
import { isBlobConfigured } from "@/lib/hosting-readiness";

import { localMediaStorage } from "./types";
import { vercelBlobMediaStorage } from "./vercel-blob";

export type {
  MediaStorageProvider,
  MediaUploadInput,
  MediaUploadResult,
} from "./types";
export { LocalMediaStorageProvider, localMediaStorage } from "./types";

/**
 * Local disk in development. Vercel Blob on the hosted site once the store
 * is connected. Vercel without Blob refuses uploads so files are not lost
 * on the next deploy.
 */
export function getMediaStorage() {
  if (isBlobConfigured()) return vercelBlobMediaStorage;
  if (process.env.VERCEL) {
    throw new AppError(
      "Photo uploads on the hosted site need a Vercel Blob store. Connect Blob in the Vercel project so BLOB_READ_WRITE_TOKEN is set.",
      { code: "MEDIA_NOT_CONFIGURED", status: 503 },
    );
  }
  return localMediaStorage;
}
