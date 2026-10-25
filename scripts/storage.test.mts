import assert from "node:assert/strict";
import { test } from "node:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { LocalStorageProvider, UPLOAD_URL_PREFIX } from "../src/lib/storage/local";
import { kindForExtension, matchesDeclaredExtension } from "../src/lib/storage/allowed";

/**
 * Regression test for the "uploaded image 404 for peserta" bug.
 *
 * Uploads must never be advertised as `/uploads/<file>` (a path served from
 * `public/`, which `next build` snapshots and `next start` refuses to serve for
 * files created afterwards). They must be served by the runtime route
 * `GET /api/uploads/[...path]`.
 */
const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "joki-upload-test-"));

test("uploaded files are stored on disk and exposed via the runtime route", async () => {
  process.env.UPLOAD_DIR = tmpDir;
  const provider = new LocalStorageProvider();
  const content = Buffer.from("fake-image-bytes");

  const result = await provider.upload(content, "contoh soal.jpg", "image/jpeg");

  assert.equal(
    result.fileUrl.startsWith(`${UPLOAD_URL_PREFIX}/`),
    true,
    `fileUrl must use ${UPLOAD_URL_PREFIX}, got ${result.fileUrl}`
  );
  assert.equal(
    result.fileUrl.startsWith("/uploads/"),
    false,
    "fileUrl must not point at the build-time public/ path"
  );
  assert.equal(result.fileName, "contoh soal.jpg");
  assert.equal(result.fileSize, content.length);
  assert.equal(result.mimeType, "image/jpeg");

  const storedName = path.basename(result.fileUrl);
  const onDisk = await fs.readFile(path.join(tmpDir, storedName));
  assert.deepEqual(onDisk, content, "file must be written inside UPLOAD_DIR");

  await provider.delete(result.fileUrl);
  await assert.rejects(
    () => fs.access(path.join(tmpDir, storedName)),
    "delete() must remove the stored file"
  );
});

test("uploaded names are unique so re-uploading never overwrites other media", async () => {
  process.env.UPLOAD_DIR = tmpDir;
  const provider = new LocalStorageProvider();

  const first = await provider.upload(Buffer.from("a"), "same-name.png", "image/png");
  const second = await provider.upload(Buffer.from("b"), "same-name.png", "image/png");

  assert.notEqual(first.fileUrl, second.fileUrl);
});

test("stored names never carry an executable or unvetted extension", async () => {
  process.env.UPLOAD_DIR = tmpDir;
  const provider = new LocalStorageProvider();

  for (const name of ["shell.php", "shell.phtml", "shell.phar", "shell.jsp", ".htaccess", "x.sh"]) {
    const result = await provider.upload(Buffer.from("payload"), name, "application/octet-stream");
    assert.equal(
      path.extname(path.basename(result.fileUrl)),
      "",
      `${name} must be stored without an extension, got ${result.fileUrl}`
    );
  }

  const image = await provider.upload(Buffer.from("img"), "foto.JPG", "image/jpeg");
  assert.equal(path.extname(path.basename(image.fileUrl)), ".jpg");
});

test("allowlist maps known extensions to a kind and rejects the rest", () => {
  assert.equal(kindForExtension(".jpg"), "IMAGE");
  assert.equal(kindForExtension(".MP4"), "VIDEO");
  assert.equal(kindForExtension(".pdf"), "FILE");
  for (const ext of [".php", ".phtml", ".phar", ".jsp", ".asp", ".cgi", ".sh", ".exe", ".htaccess", ""]) {
    assert.equal(kindForExtension(ext), null, `${ext} must not be allowed`);
  }
});

test.after(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

test("file bytes must match the declared extension", () => {
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
  const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0]);
  const gifPhpPolyglot = Buffer.from("GIF89a<?php system($_GET['c']); ?>", "latin1");

  assert.equal(matchesDeclaredExtension(png, ".png"), true);
  assert.equal(matchesDeclaredExtension(jpeg, ".jpg"), true);
  assert.equal(matchesDeclaredExtension(gifPhpPolyglot, ".jpg"), false);
  assert.equal(matchesDeclaredExtension(gifPhpPolyglot, ".png"), false);
  assert.equal(matchesDeclaredExtension(Buffer.from("<?php echo 1; ?>"), ".jpg"), false);
  assert.equal(matchesDeclaredExtension(Buffer.from("hello"), ".txt"), true);
});
