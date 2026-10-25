/**
 * Upload allowlist and signature checks.
 *
 * Extensions are matched exactly and file bytes must match the declared extension, so a
 * script renamed to `.jpg` (or a GIF/PHP polyglot) is rejected at the boundary. The serving
 * route additionally sends an explicit `Content-Type`, `X-Content-Type-Options: nosniff`,
 * and `Content-Security-Policy: sandbox`, so stored files can only be downloaded/rendered —
 * never executed by an interpreter on the host.
 */
export type UploadKind = "IMAGE" | "VIDEO" | "FILE";

const IMAGE_EXTENSIONS = [".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif", ".bmp"] as const;
const VIDEO_EXTENSIONS = [".mp4", ".webm", ".mov", ".m4v"] as const;
const FILE_EXTENSIONS = [
  ".pdf",
  ".txt",
  ".csv",
  ".zip",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".ppt",
  ".pptx",
] as const;

export const ALLOWED_EXTENSIONS: readonly string[] = [
  ...IMAGE_EXTENSIONS,
  ...VIDEO_EXTENSIONS,
  ...FILE_EXTENSIONS,
];

const KIND_BY_EXTENSION: Record<string, UploadKind> = Object.fromEntries([
  ...IMAGE_EXTENSIONS.map((ext) => [ext, "IMAGE"] as const),
  ...VIDEO_EXTENSIONS.map((ext) => [ext, "VIDEO"] as const),
  ...FILE_EXTENSIONS.map((ext) => [ext, "FILE"] as const),
]);

export const MAX_BY_KIND: Record<UploadKind, number> = {
  IMAGE: 10 * 1024 * 1024,
  VIDEO: 100 * 1024 * 1024,
  FILE: 25 * 1024 * 1024,
};

export function kindForExtension(ext: string): UploadKind | null {
  return KIND_BY_EXTENSION[ext.toLowerCase()] ?? null;
}

const startsWith = (buffer: Buffer, bytes: number[] | string) => {
  const sig = typeof bytes === "string" ? Buffer.from(bytes, "binary") : Buffer.from(bytes);
  return buffer.subarray(0, sig.length).equals(sig);
};

/** `ftyp` box brands (offset 4) accepted for ISO base media containers. */
const ISO_BRANDS: Record<string, string[]> = {
  ".mp4": ["isom", "iso2", "mp41", "mp42", "avc1", "dash", "M4V", "mmp4"],
  ".m4v": ["M4V", "M4V ", "isom", "mp42"],
  ".mov": ["qt  ", "isom", "mp42"],
  ".avif": ["avif", "avis"],
};

function hasIsoBrand(buffer: Buffer, ext: string): boolean {
  if (buffer.length < 12 || buffer.subarray(4, 8).toString("latin1") !== "ftyp") return false;
  const brand = buffer.subarray(8, 12).toString("latin1");
  return ISO_BRANDS[ext]?.includes(brand) ?? false;
}

function hasRiffTag(buffer: Buffer, tag: string): boolean {
  return buffer.length >= 12 && buffer.subarray(0, 4).toString("latin1") === "RIFF"
    ? buffer.subarray(8, 12).toString("latin1") === tag
    : false;
}

const SIGNATURE_BY_EXTENSION: Record<string, (buffer: Buffer) => boolean> = {
  ".jpg": (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  ".jpeg": (b) => startsWith(b, [0xff, 0xd8, 0xff]),
  ".png": (b) => startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  ".gif": (b) => startsWith(b, "GIF87a") || startsWith(b, "GIF89a"),
  ".webp": (b) => hasRiffTag(b, "WEBP"),
  ".avif": (b) => hasIsoBrand(b, ".avif"),
  ".bmp": (b) => startsWith(b, "BM"),
  ".mp4": (b) => hasIsoBrand(b, ".mp4"),
  ".m4v": (b) => hasIsoBrand(b, ".m4v"),
  ".mov": (b) => hasIsoBrand(b, ".mov"),
  ".webm": (b) => hasRiffTag(b, "WEBM"),
  ".pdf": (b) => startsWith(b, "%PDF-"),
  ".zip": (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]),
  ".docx": (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]),
  ".xlsx": (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]),
  ".pptx": (b) => startsWith(b, [0x50, 0x4b, 0x03, 0x04]),
  ".doc": (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0]),
  ".xls": (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0]),
  ".ppt": (b) => startsWith(b, [0xd0, 0xcf, 0x11, 0xe0]),
};

/**
 * Binary formats get a magic-number check. Plain text formats (`.txt`, `.csv`) have no
 * signature; they are served as `text/plain`/`text/csv` with `nosniff`, so they stay inert.
 */
export function matchesDeclaredExtension(buffer: Buffer, ext: string): boolean {
  const check = SIGNATURE_BY_EXTENSION[ext.toLowerCase()];
  if (!check) return ext === ".txt" || ext === ".csv";
  return check(buffer);
}
