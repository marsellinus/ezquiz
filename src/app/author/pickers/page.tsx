import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  PlusCircle, 
  Search, 
  Shuffle, 
  ExternalLink, 
  Eye, 
  Edit3, 
  CheckCircle2, 
  FileEdit,
  Trash2,
  Copy
} from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function AuthorPickersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; search?: string }>;
}) {
  const session = await auth();
  const authorId = session?.user?.id;
  const { status, search } = await searchParams;

  const whereClause: any = { authorId };
  if (status && ["PUBLISHED", "DRAFT", "ARCHIVED"].includes(status)) {
    whereClause.status = status;
  }
  if (search) {
    whereClause.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  const pickers = await prisma.randomPicker.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { questions: true, histories: true } },
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kelola Random Picker</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar seluruh kumpulan soal yang telah Anda buat.</p>
        </div>

        <Link
          href="/author/pickers/new"
          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
        >
          <PlusCircle className="w-4 h-4" /> Create New Picker
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
        <div className="flex items-center gap-1 bg-white p-1 border border-gray-200 rounded-xl text-sm font-medium">
          <Link
            href="/author/pickers"
            className={`px-4 py-2 rounded-lg transition-colors ${
              !status ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All
          </Link>
          <Link
            href="/author/pickers?status=PUBLISHED"
            className={`px-4 py-2 rounded-lg transition-colors ${
              status === "PUBLISHED" ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Published
          </Link>
          <Link
            href="/author/pickers?status=DRAFT"
            className={`px-4 py-2 rounded-lg transition-colors ${
              status === "DRAFT" ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Draft
          </Link>
          <Link
            href="/author/pickers?status=ARCHIVED"
            className={`px-4 py-2 rounded-lg transition-colors ${
              status === "ARCHIVED" ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Archived
          </Link>
        </div>

        <form method="GET" className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="search"
            defaultValue={search || ""}
            placeholder="Cari berdasarkan judul..."
            className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors w-full md:w-72 shadow-sm"
          />
        </form>
      </div>

      {/* Pickers Grid */}
      {pickers.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="bg-gray-50 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-gray-100">
            <Shuffle className="w-6 h-6 text-gray-400" />
          </div>
          <h3 className="text-gray-900 font-semibold mb-1">Tidak ada Random Picker</h3>
          <p className="text-gray-500 text-sm mb-4">
            {search ? "Tidak ditemukan picker yang cocok dengan pencarian Anda." : "Anda belum memiliki picker pada status ini."}
          </p>
          <Link
            href="/author/pickers/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Buat Picker Baru
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {pickers.map((picker) => (
            <div key={picker.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all duration-200">
              <div>
                <div className="flex justify-between items-start mb-3 gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    picker.status === "PUBLISHED" 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : picker.status === "DRAFT"
                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}>
                    {picker.status === "PUBLISHED" ? <CheckCircle2 className="w-3 h-3" /> : <FileEdit className="w-3 h-3" />}
                    {picker.status}
                  </span>
                  <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded border border-gray-100">
                    {picker._count.questions} Soal
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-1">
                  <Link href={`/author/pickers/${picker.id}`} className="hover:underline">
                    {picker.title}
                  </Link>
                </h3>
                
                <p className="text-gray-500 text-sm line-clamp-2 mb-6 min-h-[40px]">
                  {picker.description || "Tidak ada deskripsi."}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/author/pickers/${picker.id}`}
                    className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Soal & Setelan"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/author/pickers/${picker.id}/preview`}
                    className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Preview User Mode"
                  >
                    <Eye className="w-4 h-4" />
                  </Link>

                  {picker.status === "PUBLISHED" && (
                    <a
                      href={`/p/${picker.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50 rounded-lg transition-colors"
                      title="Buka Public Link"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <form action={async () => {
                    "use server";
                    const existing = await prisma.randomPicker.findUnique({
                      where: { id: picker.id },
                      include: {
                        settings: true,
                        questions: { include: { attachments: true, links: true } }
                      }
                    });
                    if (!existing) return;

                    const newSlug = Math.random().toString(36).substring(2, 12);
                    await prisma.randomPicker.create({
                      data: {
                        authorId: authorId!,
                        title: `${existing.title} (Copy)`,
                        description: existing.description,
                        slug: newSlug,
                        status: "DRAFT",
                        settings: existing.settings ? {
                          create: {
                            allowRepeat: existing.settings.allowRepeat,
                            preventImmediateRepeat: existing.settings.preventImmediateRepeat,
                            noRepeatUntilAllShown: existing.settings.noRepeatUntilAllShown,
                            showQuestionNumber: existing.settings.showQuestionNumber,
                            showAttachments: existing.settings.showAttachments,
                            showLinks: existing.settings.showLinks,
                          }
                        } : undefined,
                        questions: {
                          create: existing.questions.map(q => ({
                            content: q.content,
                            position: q.position,
                            isActive: q.isActive,
                            attachments: {
                              create: q.attachments.map(a => ({
                                type: a.type,
                                fileName: a.fileName,
                                fileUrl: a.fileUrl,
                                mimeType: a.mimeType,
                                fileSize: a.fileSize,
                              }))
                            },
                            links: {
                              create: q.links.map(l => ({
                                title: l.title,
                                url: l.url,
                              }))
                            }
                          }))
                        }
                      }
                    });
                    revalidatePath("/author/pickers");
                  }}>
                    <button
                      type="submit"
                      className="p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Duplikasi Picker"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </form>

                  <form action={async () => {
                    "use server";
                    await prisma.randomPicker.delete({
                      where: { id: picker.id }
                    });
                    revalidatePath("/author/pickers");
                  }}>
                    <button
                      type="submit"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Picker"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
