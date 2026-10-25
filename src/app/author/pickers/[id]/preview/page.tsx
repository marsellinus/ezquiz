import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Eye } from "lucide-react";
import { PublicShuffleClient } from "@/components/public/PublicShuffleClient";

export default async function AuthorPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const authorId = session?.user?.id;
  const { id } = await params;

  const picker = await prisma.randomPicker.findFirst({
    where: { id, authorId },
    include: {
      settings: true,
    },
  });

  if (!picker) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Banner indicating Preview Mode */}
      <div className="bg-amber-500 text-white px-6 py-2.5 flex items-center justify-between shadow-sm z-40">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          <Eye className="w-4 h-4" /> Mode Preview Author (Simulasi Pengguna)
        </div>
        <Link
          href={`/author/pickers/${picker.id}`}
          className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Editor
        </Link>
      </div>

      {/* Render Public Shuffle Experience in Preview Mode */}
      <div className="flex-1">
        <PublicShuffleClient
          picker={{
            title: picker.title,
            description: picker.description,
            slug: picker.slug,
            isPreview: true,
            pickerId: picker.id,
          }}
        />
      </div>
    </div>
  );
}
