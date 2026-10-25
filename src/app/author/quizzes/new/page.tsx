import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BrainCircuit, PlusCircle } from "lucide-react";
import { nanoid } from "nanoid";

export default async function NewQuizPage() {
  const session = await auth();
  const authorId = session?.user?.id;

  async function createQuiz(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const mode = (formData.get("mode") as "SELF_PACED" | "LIVE") || "SELF_PACED";

    if (!title || !authorId) return;

    const slug = `quiz-${nanoid(8)}`;

    const quiz = await prisma.quiz.create({
      data: {
        authorId,
        title,
        description: description || null,
        slug,
        status: "DRAFT",
        mode,
      },
    });

    redirect(`/author/quizzes/${quiz.id}`);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <Link
        href="/author/quizzes"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Quiz
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-8 border-b border-gray-100 pb-6 flex items-center gap-3">
          <div className="bg-purple-50 text-purple-700 p-3 rounded-xl">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Buat Quiz Interaktif Baru</h1>
            <p className="text-gray-500 text-sm">
              Tentukan judul kuis dan mode permainan (Self-Paced atau Live Game).
            </p>
          </div>
        </div>

        <form action={createQuiz} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Judul Quiz <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="Contoh: Kuis Interaktif Pemrograman Web"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              name="description"
              rows={3}
              placeholder="Contoh: Kuis interaktif 10 soal dengan poin & speed bonus."
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Mode Permainan Initial
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="border border-gray-200 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-gray-900 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="SELF_PACED"
                  defaultChecked
                  className="mt-1 text-gray-900 border-gray-300 focus:ring-gray-900"
                />
                <div>
                  <span className="font-bold text-gray-900 text-sm block">🎮 Self-Paced Mode</span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    Peserta langsung mengerjakan kuis secara mandiri via link kapan saja.
                  </span>
                </div>
              </label>

              <label className="border border-gray-200 rounded-xl p-4 flex items-start gap-3 cursor-pointer hover:border-gray-900 transition-colors">
                <input
                  type="radio"
                  name="mode"
                  value="LIVE"
                  className="mt-1 text-gray-900 border-gray-300 focus:ring-gray-900"
                />
                <div>
                  <span className="font-bold text-gray-900 text-sm block">⚡ Live Game Mode</span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    Host memandu kuis secara langsung dengan Kode Game (Lobby & Leaderboard).
                  </span>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Link
              href="/author/quizzes"
              className="px-5 py-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Create & Build Questions
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
