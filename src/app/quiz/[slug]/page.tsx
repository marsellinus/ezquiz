import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import { SelfPacedQuizClient } from "@/components/quiz/SelfPacedQuizClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const quiz = await prisma.quiz.findUnique({
    where: { slug },
    select: { title: true, description: true, status: true },
  });

  if (!quiz || quiz.status !== "PUBLISHED") {
    return {
      title: "Quiz Not Found",
    };
  }

  return {
    title: `${quiz.title} | INTERACTIVE QUIZ`,
    description: quiz.description || "Kuis interaktif self-paced.",
  };
}

export default async function PublicQuizPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const quiz = await prisma.quiz.findUnique({
    where: { slug },
    include: {
      questions: {
        orderBy: { position: "asc" },
        include: {
          question: {
            include: {
              // SECURITY: DO NOT include isCorrect field when sending to public!
              options: {
                orderBy: { position: "asc" },
                select: { id: true, text: true },
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
  });

  if (!quiz || quiz.status !== "PUBLISHED") {
    return notFound();
  }

  const formattedQuestions = quiz.questions.map((qq) => ({
    id: qq.question.id,
    type: qq.question.type,
    content: qq.question.content,
    points: qq.points,
    timeLimit: qq.timeLimit,
    position: qq.position,
    options: qq.question.options.map((opt) => ({
      id: opt.id,
      text: opt.text,
    })),
    attachments: qq.question.attachments.map((att) => ({
      type: att.type,
      fileName: att.fileName,
      fileUrl: att.fileUrl,
      mimeType: att.mimeType,
      fileSize: att.fileSize,
    })),
  }));

  const publicQuizData = {
    title: quiz.title,
    description: quiz.description,
    slug: quiz.slug,
    questions: formattedQuestions,
  };

  return <SelfPacedQuizClient quiz={publicQuizData} />;
}
