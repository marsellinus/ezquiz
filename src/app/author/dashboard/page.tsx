import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";
import { 
  Shuffle, 
  HelpCircle, 
  CheckCircle2, 
  FileEdit, 
  TrendingUp, 
  ExternalLink,
  BrainCircuit,
  Gamepad2
} from "lucide-react";
import { CreateChoiceModal } from "@/components/author/CreateChoiceModal";

export default async function AuthorDashboard() {
  const session = await auth();
  const authorId = session?.user?.id;

  if (!authorId) {
    redirect("/login");
  }

  const totalPickers = await prisma.randomPicker.count({ where: { authorId } });
  const totalQuizzes = await prisma.quiz.count({ where: { authorId } });
  const publishedQuizzes = await prisma.quiz.count({ where: { authorId, status: "PUBLISHED" } });
  
  const totalQuestions = await prisma.question.count();

  const totalShuffle = await prisma.randomPickHistory.count({
    where: { randomPicker: { authorId } }
  });

  const recentQuizzes = await prisma.quiz.findMany({
    where: { authorId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      _count: { select: { questions: true, sessions: true } }
    }
  });

  const recentPickers = await prisma.randomPicker.findMany({
    where: { authorId },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: {
      _count: { select: { questions: true } }
    }
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard Author</h1>
          <p className="text-sm text-gray-500 mt-1">Selamat datang kembali, {session?.user?.name || "Author"}</p>
        </div>

        <CreateChoiceModal />
      </div>

      {/* Stat Cards Grid (Section G Format) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Interactive Quiz</span>
            <BrainCircuit className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{totalQuizzes}</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Random Picker</span>
            <Shuffle className="w-4 h-4 text-indigo-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{totalPickers}</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Questions</span>
            <HelpCircle className="w-4 h-4 text-blue-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{totalQuestions}</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Published Quiz</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{publishedQuizzes}</h3>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Shuffle</span>
            <TrendingUp className="w-4 h-4 text-purple-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900">{totalShuffle.toLocaleString()}</h3>
        </div>
      </div>

      {/* Quizzes Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <BrainCircuit className="w-5 h-5 text-purple-600" />
            <h2 className="text-base font-bold text-gray-900">Quiz Interaktif Terbaru</h2>
          </div>
          <Link href="/author/quizzes" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Lihat Semua Quiz →
          </Link>
        </div>

        {recentQuizzes.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Belum ada Quiz yang dibuat. Klik <strong>Create New Project</strong> untuk membuat quiz pertama Anda!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Judul Quiz</th>
                  <th className="py-3 px-4">Jumlah Soal</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentQuizzes.map((quiz) => (
                  <tr key={quiz.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-gray-900">
                      <Link href={`/author/quizzes/${quiz.id}`} className="hover:underline">
                        {quiz.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">{quiz._count.questions} Soal</td>
                    <td className="py-3.5 px-4 font-semibold text-xs text-purple-700">
                      {quiz.mode}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        quiz.status === "PUBLISHED" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {quiz.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/author/quizzes/${quiz.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2.5 rounded-md transition-colors"
                      >
                        Edit Soal
                      </Link>
                      <Link
                        href={`/quiz/${quiz.slug}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-2.5 rounded-md transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" /> Play Self-Paced
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Recent Random Pickers Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Shuffle className="w-5 h-5 text-indigo-600" />
            <h2 className="text-base font-bold text-gray-900">Random Picker Terbaru</h2>
          </div>
          <Link href="/author/pickers" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Lihat Semua Picker →
          </Link>
        </div>

        {recentPickers.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">
            Belum ada Random Picker yang dibuat.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold border-b border-gray-100">
                <tr>
                  <th className="py-3 px-4">Judul</th>
                  <th className="py-3 px-4">Jumlah Soal</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPickers.map((picker) => (
                  <tr key={picker.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3.5 px-4 font-medium text-gray-900">
                      <Link href={`/author/pickers/${picker.id}`} className="hover:underline">
                        {picker.title}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">{picker._count.questions} Soal</td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                        picker.status === "PUBLISHED" 
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
                          : "bg-amber-50 text-amber-700 border border-amber-200"
                      }`}>
                        {picker.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        href={`/author/pickers/${picker.id}`}
                        className="inline-flex items-center gap-1 text-xs font-medium text-gray-700 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 px-3 py-2.5 rounded-md transition-colors"
                      >
                        Edit
                      </Link>
                      {picker.status === "PUBLISHED" && (
                        <a
                          href={`/p/${picker.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-2.5 rounded-md transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> Public Link
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
