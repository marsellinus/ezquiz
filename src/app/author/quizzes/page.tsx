import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { 
  PlusCircle, 
  Search, 
  BrainCircuit, 
  ExternalLink, 
  Edit3, 
  CheckCircle2, 
  FileEdit,
  Trash2,
  Play,
  Users,
  BarChart2
} from "lucide-react";
import { revalidatePath } from "next/cache";

export default async function AuthorQuizzesPage({
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

  const quizzes = await prisma.quiz.findMany({
    where: whereClause,
    orderBy: { updatedAt: "desc" },
    include: {
      _count: { select: { questions: true, sessions: true } },
    },
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Kelola Interactive Quiz</h1>
          <p className="text-sm text-gray-500 mt-1">Daftar seluruh kuis interaktif yang telah Anda buat.</p>
        </div>

        <Link
          href="/author/quizzes/new"
          className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2.5 rounded-xl transition-colors font-bold text-sm flex items-center gap-2 shadow-md"
        >
          <PlusCircle className="w-4 h-4" /> Create New Quiz
        </Link>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 mb-6">
        <div className="flex items-center gap-1 bg-white p-1 border border-gray-200 rounded-xl text-sm font-medium">
          <Link
            href="/author/quizzes"
            className={`px-4 py-2 rounded-lg transition-colors ${
              !status ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            All
          </Link>
          <Link
            href="/author/quizzes?status=PUBLISHED"
            className={`px-4 py-2 rounded-lg transition-colors ${
              status === "PUBLISHED" ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Published
          </Link>
          <Link
            href="/author/quizzes?status=DRAFT"
            className={`px-4 py-2 rounded-lg transition-colors ${
              status === "DRAFT" ? "bg-gray-900 text-white shadow-sm" : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Draft
          </Link>
        </div>

        <form method="GET" className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            name="search"
            defaultValue={search || ""}
            placeholder="Cari judul kuis..."
            className="bg-white border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors w-full md:w-72 shadow-sm"
          />
        </form>
      </div>

      {/* Quizzes Grid */}
      {quizzes.length === 0 ? (
        <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-12 text-center">
          <div className="bg-purple-50 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 border border-purple-100">
            <BrainCircuit className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-gray-900 font-semibold mb-1">Belum ada Quiz</h3>
          <p className="text-gray-500 text-sm mb-4">
            {search ? "Tidak ditemukan kuis yang cocok dengan pencarian Anda." : "Buat kuis interaktif pertama Anda sekarang!"}
          </p>
          <Link
            href="/author/quizzes/new"
            className="inline-flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors"
          >
            <PlusCircle className="w-4 h-4" /> Create Quiz Baru
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:border-gray-300 transition-all duration-200">
              <div>
                <div className="flex justify-between items-start mb-3 gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    quiz.status === "PUBLISHED" 
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {quiz.status === "PUBLISHED" ? <CheckCircle2 className="w-3 h-3" /> : <FileEdit className="w-3 h-3" />}
                    {quiz.status}
                  </span>
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded border border-purple-100">
                    {quiz._count.questions} Soal
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-base mb-2 line-clamp-1">
                  <Link href={`/author/quizzes/${quiz.id}`} className="hover:underline">
                    {quiz.title}
                  </Link>
                </h3>
                
                <p className="text-gray-500 text-sm line-clamp-2 mb-6 min-h-[40px]">
                  {quiz.description || "Tidak ada deskripsi kuis."}
                </p>
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Link
                    href={`/author/quizzes/${quiz.id}`}
                    className="p-2.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    title="Edit Quiz & Soal"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>

                  <Link
                    href={`/author/quizzes/${quiz.id}/analytics`}
                    className="p-2.5 text-purple-600 hover:text-purple-900 hover:bg-purple-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                    title="Lihat Rekap Nilai & Analisis Peserta"
                  >
                    <BarChart2 className="w-4 h-4" /> Rekap Nilai
                  </Link>

                  {quiz.status === "PUBLISHED" && (
                    <a
                      href={`/quiz/${quiz.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 text-emerald-600 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Buka Link Mandiri"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <form action={async () => {
                    "use server";
                    await prisma.quiz.delete({
                      where: { id: quiz.id }
                    });
                    revalidatePath("/author/quizzes");
                  }}>
                    <button
                      type="submit"
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Hapus Quiz"
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
