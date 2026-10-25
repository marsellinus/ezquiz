import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { HostControlClient } from "@/components/author/HostControlClient";

export default async function HostControlPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const sessionUser = await auth();
  const authorId = sessionUser?.user?.id;
  const { id } = await params;

  const session = await prisma.quizSession.findFirst({
    where: { id, quiz: { authorId } },
    include: {
      quiz: {
        include: { questions: true }
      },
      participants: { orderBy: { score: "desc" } },
    },
  });

  if (!session) {
    return notFound();
  }

  return (
    <HostControlClient
      initialSession={{
        id: session.id,
        joinCode: session.joinCode,
        quizTitle: session.quiz.title,
        status: session.status,
        currentQuestionIndex: session.currentQuestionIndex,
        totalQuestions: session.quiz.questions.length,
        participants: session.participants.map((p: { id: string; nickname: string; score: number }) => ({
          id: p.id,
          nickname: p.nickname,
          score: p.score,
        })),
      }}
    />
  );
}
