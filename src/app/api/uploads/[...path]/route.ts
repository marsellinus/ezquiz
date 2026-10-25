import { NextResponse } from "next/server";
import { createReadStream } from "fs";
import fs from "fs/promises";
import path from "path";
import { Readable } from "stream";
import { resolveUploadDir } from "@/lib/storage/local";

export const dynamic = "force-dynamic";

/**
 * Public read endpoint for uploaded files.
 *
 * Why this exists: `public/` assets are baked into the Next.js production build
 * (`next build`), so files written to `public/uploads` at runtime are NOT served
 * in `next start` (they 404). Serving uploads through a route handler keeps the
 * read path identical for every role (author & peserta) and independent of the
 * build output. WRITE access stays on POST /api/upload (author-only), while
 * READ is public — which is exactly the access model of a published quiz/picker.
 */
const UPLOAD_DIR = resolveUploadDir();

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
  ".pdf": "application/pdf",
  ".txt": "text/plain; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".zip": "application/zip",
  ".doc": "application/msword",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

/** Resolve a request path inside UPLOAD_DIR, rejecting traversal attempts. */
function resolveUploadPath(segments: string[]): string | null {
  if (!segments.length) return null;

  const joined = segments.join("/");
  if (joined.includes("\0")) return null;

  const abs = path.resolve(UPLOAD_DIR, joined);
  const root = path.resolve(UPLOAD_DIR);
  if (abs !== root && !abs.startsWith(root + path.sep)) return null;

  return abs;
}

/** Parse a single-range `bytes=` header against a known file size. */
function parseRange(header: string, size: number): { start: number; end: number } | null {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  if (rawStart === "" && rawEnd === "") return null;

  let start: number;
  let end: number;

  if (rawStart === "") {
    // Suffix range: bytes=-N (last N bytes)
    const suffixLength = Number(rawEnd);
    if (!Number.isFinite(suffixLength) || suffixLength <= 0) return null;
    start = Math.max(size - suffixLength, 0);
    end = size - 1;
  } else {
    start = Number(rawStart);
    end = rawEnd === "" ? size - 1 : Math.min(Number(rawEnd), size - 1);
    if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
  }

  if (start > end || start >= size) return null;
  return { start, end };
}

async function serve(
  req: Request,
  ctx: { params: Promise<{ path: string[] }> },
  withBody: boolean
): Promise<NextResponse> {
  const { path: segments } = await ctx.params;

  const filePath = resolveUploadPath(segments);
  if (!filePath) {
    return new NextResponse("Not found", { status: 404 });
  }

  let stat;
  try {
    stat = await fs.stat(filePath);
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
  if (!stat.isFile()) {
    return new NextResponse("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type":
      CONTENT_TYPES[path.extname(filePath).toLowerCase()] ?? "application/octet-stream",
    "Accept-Ranges": "bytes",
    "Cache-Control": "public, max-age=31536000, immutable",
    "Last-Modified": stat.mtime.toUTCString(),
    "X-Content-Type-Options": "nosniff",
    // Uploaded files are user content: never let them execute script if opened directly.
    "Content-Security-Policy": "sandbox",
  };

  const rangeHeader = req.headers.get("range");
  if (rangeHeader) {
    const range = parseRange(rangeHeader, stat.size);
    if (!range) {
      return new NextResponse(null, {
        status: 416,
        headers: { ...headers, "Content-Range": `bytes */${stat.size}` },
      });
    }

    const { start, end } = range;
    const rangeHeaders = {
      ...headers,
      "Content-Range": `bytes ${start}-${end}/${stat.size}`,
      "Content-Length": String(end - start + 1),
    };

    if (!withBody) return new NextResponse(null, { status: 206, headers: rangeHeaders });

    const stream = Readable.toWeb(
      createReadStream(filePath, { start, end })
    ) as unknown as ReadableStream<Uint8Array>;
    return new NextResponse(stream, { status: 206, headers: rangeHeaders });
  }

  const fullHeaders = { ...headers, "Content-Length": String(stat.size) };
  if (!withBody) return new NextResponse(null, { status: 200, headers: fullHeaders });

  const stream = Readable.toWeb(createReadStream(filePath)) as unknown as ReadableStream<Uint8Array>;
  return new NextResponse(stream, { status: 200, headers: fullHeaders });
}

export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return serve(req, ctx, true);
}

export async function HEAD(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  return serve(req, ctx, false);
}
