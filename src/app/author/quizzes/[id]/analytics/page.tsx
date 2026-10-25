import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { AnalyticsViewClient } from "@/components/author/AnalyticsViewClient";

export default async function QuizAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessionUser = await auth();
  const authorId = sessionUser?.user?.id;
  const { id } = await params;

  const quiz = await prisma.quiz.findFirst({
    where: { id, authorId },
    include: {
      sessions: {
        orderBy: { createdAt: "desc" },
        include: {
          participants: {
            include: {
              answers: {
                include: { question: true },
              },
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    return notFound();
  }

  const formattedSessions = quiz.sessions.map((s) => ({
    id: s.id,
    joinCode: s.joinCode,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    participants: s.participants.map((p) => ({
      id: p.id,
      nickname: p.nickname,
      className: (p as any).className || "Umum / Tanpa Kelas",
      score: p.score,
      tabSwitchCount: (p as any).tabSwitchCount || 0,
      answers: p.answers.map((a) => ({
        id: a.id,
        questionContent: a.question?.content || "Pertanyaan",
        answerData: a.answerData,
        isCorrect: a.isCorrect,
        pointsEarned: a.points,
      })),
    })),
  }));

  return (
    <AnalyticsViewClient
      quizTitle={quiz.title}
      quizSlug={quiz.slug}
      sessions={formattedSessions}
    />
  );
}
