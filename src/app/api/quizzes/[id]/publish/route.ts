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
    const quiz = await prisma.quiz.findFirst({
      where: { id, authorId: session.user.id },
      include: { questions: true },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
    }

    if (quiz.questions.length === 0) {
      return NextResponse.json({ error: "Minimal harus ada 1 soal sebelum dipublikasikan" }, { status: 400 });
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
      },
    });

    return NextResponse.json({ message: "Quiz berhasil dipublikasikan!", quiz: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
  }
}
