import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const picker = await prisma.randomPicker.findFirst({
      where: { id, authorId: session.user.id },
      include: { questions: true },
    });

    if (!picker) {
      return NextResponse.json({ error: "Random Picker tidak ditemukan" }, { status: 404 });
    }

    // Validation before publish
    if (!picker.title.trim()) {
      return NextResponse.json({ error: "Judul picker tidak boleh kosong" }, { status: 400 });
    }

    const activeQuestions = picker.questions.filter((q) => q.isActive && q.content.trim() !== "");
    if (activeQuestions.length === 0) {
      return NextResponse.json(
        { error: "Minimal harus ada 1 soal aktif yang tidak kosong sebelum dipublikasikan" },
        { status: 400 }
      );
    }

    const updated = await prisma.randomPicker.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({
      message: "Random Picker berhasil dipublikasikan!",
      picker: updated,
      publicUrl: `/p/${updated.slug}`,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
  }
}
