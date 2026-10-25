"use client";

import { useState } from "react";
import { FileText, Download, ExternalLink, ImageOff } from "lucide-react";

export interface QuestionAttachmentItem {
  type: string;
  fileName: string;
  fileUrl: string;
  mimeType?: string;
  fileSize?: number;
}

function formatSize(bytes?: number) {
  if (!bytes || bytes <= 0) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Shared media renderer for question attachments, used by every participant-facing
 * screen (live quiz, self-paced quiz, random picker) so all roles see identical media.
 */
export function QuestionAttachments({
  attachments,
  theme = "light",
  className = "",
}: {
  attachments: QuestionAttachmentItem[];
  theme?: "light" | "dark";
  className?: string;
}) {
  if (!attachments?.length) return null;

  const dark = theme === "dark";

  return (
    <div className={`space-y-3 ${className}`}>
      {attachments.map((att, idx) => (
        <AttachmentCard key={`${att.fileUrl}-${idx}`} attachment={att} dark={dark} />
      ))}
    </div>
  );
}

function AttachmentCard({ attachment, dark }: { attachment: QuestionAttachmentItem; dark: boolean }) {
  const [imageState, setImageState] = useState<"loading" | "ready" | "failed">("loading");
  const size = formatSize(attachment.fileSize);

  if (attachment.type === "IMAGE") {
    return (
      <figure
        className={`rounded-2xl overflow-hidden border ${
          dark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"
        }`}
      >
        {imageState === "failed" ? (
          <div
            className={`p-6 text-center text-xs space-y-2 ${
              dark ? "text-gray-300" : "text-gray-600"
            }`}
          >
            <ImageOff className="w-7 h-7 mx-auto opacity-70" />
            <p className="font-semibold">Gambar tidak dapat dimuat: {attachment.fileName}</p>
            <a
              href={attachment.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 font-bold underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> Buka di tab baru
            </a>
          </div>
        ) : (
          <div className={`relative ${imageState === "loading" ? "min-h-40" : ""}`}>
            {imageState === "loading" && (
              <div className="absolute inset-0 min-h-40 animate-pulse bg-gradient-to-r from-gray-200/60 via-gray-300/60 to-gray-200/60" />
            )}
            <a href={attachment.fileUrl} target="_blank" rel="noopener noreferrer" className="block">
              <img
                src={attachment.fileUrl}
                alt={attachment.fileName}
                decoding="async"
                className={`w-full max-h-[60vh] object-contain cursor-zoom-in transition-opacity duration-300 ${
                  imageState === "ready" ? "opacity-100" : "opacity-0"
                }`}
                onLoad={() => setImageState("ready")}
                onError={() => {
                  setImageState("failed");
                  console.error("Gagal memuat gambar:", attachment.fileUrl, attachment.fileName);
                }}
              />
            </a>
          </div>
        )}
        <figcaption
          className={`px-3 py-2 text-[11px] flex items-center justify-between gap-2 border-t ${
            dark ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"
          }`}
        >
          <span className="truncate">{attachment.fileName}</span>
          <span className="shrink-0">Klik gambar untuk memperbesar</span>
        </figcaption>
      </figure>
    );
  }

  if (attachment.type === "VIDEO") {
    return (
      <div
        className={`rounded-2xl overflow-hidden border ${
          dark ? "border-gray-700 bg-black" : "border-gray-200 bg-gray-50"
        }`}
      >
        <video
          src={attachment.fileUrl}
          controls
          preload="metadata"
          playsInline
          className="w-full max-h-[60vh] bg-black"
          onError={() => console.error("Gagal memuat video:", attachment.fileUrl, attachment.fileName)}
        />
        <p
          className={`px-3 py-2 text-[11px] truncate border-t ${
            dark ? "border-gray-700 text-gray-400" : "border-gray-200 text-gray-500"
          }`}
        >
          {attachment.fileName}
        </p>
      </div>
    );
  }

  return (
    <div
      className={`p-3 rounded-2xl border flex items-center justify-between gap-3 ${
        dark ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <FileText className="w-6 h-6 text-amber-500 shrink-0" />
        <div className="min-w-0">
          <span
            className={`text-sm font-bold block truncate ${dark ? "text-gray-100" : "text-gray-800"}`}
          >
            {attachment.fileName}
          </span>
          {size && (
            <span className={`text-xs ${dark ? "text-gray-400" : "text-gray-400"}`}>{size}</span>
          )}
        </div>
      </div>
      <a
        href={attachment.fileUrl}
        download={attachment.fileName}
        target="_blank"
        rel="noopener noreferrer"
        className={`text-xs font-bold px-4 py-2 rounded-xl transition-colors flex items-center gap-1.5 shrink-0 ${
          dark
            ? "bg-purple-600 hover:bg-purple-500 text-white"
            : "bg-gray-900 hover:bg-gray-800 text-white"
        }`}
      >
        <Download className="w-3.5 h-3.5" /> Unduh
      </a>
    </div>
  );
}
