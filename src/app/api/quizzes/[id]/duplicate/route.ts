import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

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
    const existing = await prisma.quiz.findFirst({
      where: { id, authorId: session.user.id },
      include: {
        questions: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
    }

    const newSlug = `quiz-${nanoid(8)}`;

    const duplicatedQuiz = await prisma.quiz.create({
      data: {
        authorId: session.user.id,
        title: `${existing.title} (Copy)`,
        description: existing.description,
        slug: newSlug,
        status: "DRAFT",
        mode: existing.mode,
      },
    });

    for (let i = 0; i < existing.questions.length; i++) {
      const qItem = existing.questions[i];
      const origQ = qItem.question;

      const newQ = await prisma.question.create({
        data: {
          type: origQ.type,
          content: origQ.content,
          explanation: origQ.explanation,
          position: origQ.position,
          options: {
            create: origQ.options.map((opt) => ({
              text: opt.text,
              isCorrect: opt.isCorrect,
              position: opt.position,
            })),
          },
        },
      });

      await prisma.quizQuestion.create({
        data: {
          quizId: duplicatedQuiz.id,
          questionId: newQ.id,
          position: qItem.position,
          points: qItem.points,
          timeLimit: qItem.timeLimit,
        },
      });
    }

    return NextResponse.json({
      message: "Quiz berhasil diduplikasi!",
      quiz: duplicatedQuiz,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menduplikasi quiz" }, { status: 500 });
  }
}
