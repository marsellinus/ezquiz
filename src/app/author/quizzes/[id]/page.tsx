import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuizEditorClient } from "@/components/quiz/QuizEditorClient";

export default async function QuizEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const authorId = session?.user?.id;
  const { id } = await params;

  const quiz = await prisma.quiz.findFirst({
    where: { id, authorId },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: {
          question: {
            include: {
              options: { orderBy: { position: "asc" } },
            },
          },
        },
      },
    },
  });

  if (!quiz) {
    return notFound();
  }

  // Format nested data for client editor
  const formattedQuestions = quiz.questions.map((qq: any) => ({
    id: qq.question.id,
    type: qq.question.type,
    content: qq.question.content,
    explanation: qq.question.explanation || "",
    points: qq.points,
    timeLimit: qq.timeLimit,
    position: qq.position,
    options: qq.question.options.map((opt: any) => ({
      id: opt.id,
      text: opt.text,
      isCorrect: opt.isCorrect,
    })),
  }));

  const initialQuiz = {
    id: quiz.id,
    title: quiz.title,
    description: quiz.description,
    slug: quiz.slug,
    status: quiz.status,
    mode: quiz.mode,
    questions: formattedQuestions,
  };

  return <QuizEditorClient initialQuiz={initialQuiz} />;
}
