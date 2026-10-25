import fs from "fs/promises";
import path from "path";
import { StorageProvider, UploadResult } from "./provider";
import { kindForExtension } from "./allowed";
import { nanoid } from "nanoid";

/**
 * Upload directory on disk. Shared with the read endpoint
 * (`src/app/api/uploads/[...path]/route.ts`) so both use the exact same location —
 * in Docker this is a mounted volume, not a path inside the build output.
 */
export function resolveUploadDir(): string {
  return process.env.UPLOAD_DIR
    ? path.resolve(process.env.UPLOAD_DIR)
    : path.join(process.cwd(), "public", "uploads");
}

/** Public URL prefix that serves files from the upload directory (see the read endpoint). */
export const UPLOAD_URL_PREFIX = "/api/uploads";

export class LocalStorageProvider implements StorageProvider {
  private uploadDir = resolveUploadDir();

  private async ensureDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Buffer, originalFileName: string, mimeType: string): Promise<UploadResult> {
    await this.ensureDir();

    // Defense in depth: the on-disk name never carries an unvetted extension, even if a
    // caller bypasses the upload route's allowlist check.
    const requestedExt = path.extname(originalFileName).toLowerCase();
    const ext = kindForExtension(requestedExt) ? requestedExt : "";
    const safeName = `${Date.now()}-${nanoid(8)}${ext}`;
    const filePath = path.join(this.uploadDir, safeName);

    await fs.writeFile(filePath, file);

    return {
      fileName: originalFileName,
      // Stored as a stable, environment-independent path; served by /api/uploads/[...path].
      fileUrl: `${UPLOAD_URL_PREFIX}/${safeName}`,
      mimeType,
      fileSize: file.length,
    };
  }

  async delete(fileUrl: string): Promise<void> {
    const fileName = path.basename(fileUrl);
    const filePath = path.join(this.uploadDir, fileName);
    try {
      await fs.unlink(filePath);
    } catch (e) {
      console.warn(`Could not delete file ${filePath}:`, e);
    }
  }
}
