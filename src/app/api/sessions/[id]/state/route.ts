import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  try {
    const session = await prisma.quizSession.findFirst({
      where: {
        OR: [
          { id },
          { joinCode: id.toUpperCase() }
        ]
      },
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { position: "asc" },
              include: {
                question: {
                  include: {
                    options: {
                      select: { id: true, text: true, position: true },
                    },
                    attachments: {
                      select: {
                        type: true,
                        fileName: true,
                        fileUrl: true,
                        mimeType: true,
                        fileSize: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
        participants: {
          where: {
            nickname: { not: "Observer" }
          },
          orderBy: { score: "desc" },
          select: { id: true, nickname: true, score: true },
        },
      },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi kuis tidak ditemukan" }, { status: 404 });
    }

    const currentQuizQuestion = session.quiz.questions[session.currentQuestionIndex];

    let currentQuestionData = null;
    if (currentQuizQuestion) {
      currentQuestionData = {
        id: currentQuizQuestion.question.id,
        type: currentQuizQuestion.question.type,
        content: currentQuizQuestion.question.content,
        position: currentQuizQuestion.position,
        totalQuestions: session.quiz.questions.length,
        points: currentQuizQuestion.points,
        timeLimit: currentQuizQuestion.timeLimit,
        options: currentQuizQuestion.question.options,
        attachments: currentQuizQuestion.question.attachments,
      };
    }

    return NextResponse.json({
      session: {
        id: session.id,
        joinCode: session.joinCode,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.quiz.questions.length,
        quizTitle: session.quiz.title,
      },
      currentQuestion: currentQuestionData,
      participants: session.participants,
      leaderboard: session.participants.slice(0, 5), // Top 5
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Error fetching session state" }, { status: 500 });
  }
}
