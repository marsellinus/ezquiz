import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await req.json();
    const { title, description, mode, questions } = body;

    const existing = await prisma.quiz.findFirst({
      where: { id, authorId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // 1. Update basic info
      await tx.quiz.update({
        where: { id },
        data: {
          title,
          description: description || null,
          mode: mode || "SELF_PACED",
        },
      });

      // 2. Process questions
      if (Array.isArray(questions)) {
        const existingQuizQuestions = await tx.quizQuestion.findMany({
          where: { quizId: id },
          select: { id: true, questionId: true },
        });

        const currentQIds = questions.filter((q) => !q.id.startsWith("temp-")).map((q) => q.id);
        const qqToDelete = existingQuizQuestions.filter((qq) => !currentQIds.includes(qq.questionId));

        if (qqToDelete.length > 0) {
          await tx.quizQuestion.deleteMany({
            where: { id: { in: qqToDelete.map((qq) => qq.id) } },
          });
        }

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const isTemp = q.id.startsWith("temp-");

          let targetQuestionId = q.id;

          if (isTemp) {
            // Create new question & options
            const newQ = await tx.question.create({
              data: {
                type: q.type,
                content: q.content,
                explanation: q.explanation || null,
                options: {
                  create: (q.options || []).map((opt: any, pos: number) => ({
                    text: opt.text,
                    isCorrect: opt.isCorrect,
                    position: pos + 1,
                  })),
                },
              },
            });
            targetQuestionId = newQ.id;

            await tx.quizQuestion.create({
              data: {
                quizId: id,
                questionId: targetQuestionId,
                position: i + 1,
                points: q.points || 100,
                timeLimit: q.timeLimit || 30,
              },
            });
          } else {
            // Update existing question & options
            await tx.question.update({
              where: { id: targetQuestionId },
              data: {
                type: q.type,
                content: q.content,
                explanation: q.explanation || null,
              },
            });

            await tx.quizQuestion.updateMany({
              where: { quizId: id, questionId: targetQuestionId },
              data: {
                position: i + 1,
                points: q.points || 100,
                timeLimit: q.timeLimit || 30,
              },
            });

            // Replace options
            await tx.questionOption.deleteMany({ where: { questionId: targetQuestionId } });
            if (q.options?.length) {
              await tx.questionOption.createMany({
                data: q.options.map((opt: any, pos: number) => ({
                  questionId: targetQuestionId,
                  text: opt.text,
                  isCorrect: opt.isCorrect,
                  position: pos + 1,
                })),
              });
            }
          }
        }
      }
    });

    return NextResponse.json({ message: "Quiz berhasil disimpan!" });
  } catch (error: any) {
    console.error("PATCH Quiz Error:", error);
    return NextResponse.json({ error: error.message || "Gagal menyimpan quiz" }, { status: 500 });
  }
}
