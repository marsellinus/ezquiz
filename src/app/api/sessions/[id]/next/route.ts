import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const currentSession = await prisma.quizSession.findUnique({
      where: { id },
      include: { quiz: { include: { questions: true } } },
    });

    if (!currentSession) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    if (currentSession.quiz.authorId !== sessionUser.user.id) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    let newStatus = currentSession.status;
    let newIndex = currentSession.currentQuestionIndex;

    if (currentSession.status === "QUESTION_ACTIVE") {
      newStatus = "LEADERBOARD";
    } else if (currentSession.status === "LEADERBOARD") {
      if (currentSession.currentQuestionIndex + 1 < currentSession.quiz.questions.length) {
        newStatus = "QUESTION_ACTIVE";
        newIndex = currentSession.currentQuestionIndex + 1;
      } else {
        newStatus = "FINISHED";
      }
    }

    const updated = await prisma.quizSession.update({
      where: { id },
      data: {
        status: newStatus,
        currentQuestionIndex: newIndex,
        endedAt: newStatus === "FINISHED" ? new Date() : undefined,
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal lanjut soal" }, { status: 500 });
  }
}
