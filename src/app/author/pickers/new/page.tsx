import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PlusCircle } from "lucide-react";
import { nanoid } from "nanoid";

export default async function NewPickerPage() {
  const session = await auth();
  const authorId = session?.user?.id;

  async function createPicker(formData: FormData) {
    "use server";

    const title = formData.get("title") as string;
    const description = formData.get("description") as string;

    if (!title || !authorId) return;

    // Generate clean safe slug
    const slug = nanoid(10);

    const picker = await prisma.randomPicker.create({
      data: {
        authorId,
        title,
        description: description || null,
        slug,
        status: "DRAFT",
        settings: {
          create: {
            allowRepeat: true,
            preventImmediateRepeat: true,
            noRepeatUntilAllShown: false,
            showQuestionNumber: false,
            showAttachments: true,
            showLinks: true,
          },
        },
      },
    });

    redirect(`/author/pickers/${picker.id}`);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <Link
        href="/author/pickers"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors font-medium text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Picker
      </Link>

      <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
        <div className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Buat Random Picker Baru</h1>
          <p className="text-gray-500 text-sm">
            Masukkan judul dan deskripsi singkat. Anda dapat menambahkan soal setelah ini.
          </p>
        </div>

        <form action={createPicker} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Judul Random Picker <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              required
              placeholder="Contoh: Latihan Soal Informatika Dasar"
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deskripsi Singkat (Opsional)
            </label>
            <textarea
              name="description"
              rows={4}
              placeholder="Contoh: Kumpulan soal acak untuk latihan mata kuliah Informatika. Tekan Shuffle untuk mendapatkan soal."
              className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:border-gray-900 focus:ring-1 focus:ring-gray-900 transition-colors shadow-sm"
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
            <Link
              href="/author/pickers"
              className="px-5 py-2.5 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              Batal
            </Link>
            <button
              type="submit"
              className="bg-gray-900 hover:bg-gray-800 text-white px-5 py-2.5 rounded-lg transition-colors font-medium text-sm flex items-center gap-2 shadow-sm"
            >
              <PlusCircle className="w-4 h-4" /> Create & Edit Questions
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
