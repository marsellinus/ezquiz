import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getStorageProvider } from "@/lib/storage/provider";
import {
  ALLOWED_EXTENSIONS,
  MAX_BY_KIND,
  kindForExtension,
  matchesDeclaredExtension,
} from "@/lib/storage/allowed";

/**
 * Author-only upload endpoint.
 *
 * Security posture: the stored filename is regenerated (never attacker-controlled) and the
 * extension must come from an explicit allowlist, so executables/scripts (.php, .phtml,
 * .phar, .jsp, .asp, .cgi, .sh, .htaccess …) can never land in the upload directory even if
 * the serving host later misconfigures an interpreter. The read route additionally sends
 * `X-Content-Type-Options: nosniff` and `Content-Security-Policy: sandbox`.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const ext = file.name.toLowerCase().match(/\.[a-z0-9]+$/)?.[0] ?? "";
    const kind = kindForExtension(ext);

    if (!kind) {
      return NextResponse.json(
        {
          error: `Tipe file tidak diizinkan. Gunakan: ${ALLOWED_EXTENSIONS.join(", ")}`,
        },
        { status: 415 }
      );
    }

    const maxBytes = MAX_BY_KIND[kind];
    if (file.size > maxBytes) {
      return NextResponse.json(
        { error: `Ukuran file maksimal ${Math.round(maxBytes / (1024 * 1024))} MB` },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Bytes must match the declared extension, so a script renamed to .jpg (or a
    // GIF+PHP polyglot) cannot be stored and later replayed from this origin.
    if (!matchesDeclaredExtension(buffer, ext)) {
      return NextResponse.json(
        { error: "Isi file tidak cocok dengan ekstensinya" },
        { status: 415 }
      );
    }

    const storage = getStorageProvider();
    const result = await storage.upload(buffer, file.name, file.type || "application/octet-stream");

    return NextResponse.json({ ...result, type: kind });
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
