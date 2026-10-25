export interface UploadResult {
  fileName: string;
  fileUrl: string;
  mimeType: string;
  fileSize: number;
}

export interface StorageProvider {
  upload(file: Buffer, fileName: string, mimeType: string): Promise<UploadResult>;
  delete(fileUrl: string): Promise<void>;
}

import { LocalStorageProvider } from "./local";

export function getStorageProvider(): StorageProvider {
  // Provider factory supporting local and future S3/R2 providers
  return new LocalStorageProvider();
}
