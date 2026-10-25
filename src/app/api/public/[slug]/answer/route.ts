import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const answerSchema = z.object({
  questionId: z.string().min(1),
  // MULTIPLE_CHOICE sends one option id, MULTIPLE_SELECT sends many, LONG_ANSWER sends free text.
  answerData: z.union([z.string(), z.array(z.string())]),
  isPreview: z.boolean().optional(),
  pickerId: z.string().optional(),
});

/**
 * Checks a Random Picker answer. Multiple-choice/multi-select are graded against the
 * stored key; essay answers are only acknowledged (no auto-grading, no points).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const parsed = answerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Data jawaban tidak valid" }, { status: 400 });
  }

  const { questionId, answerData, isPreview, pickerId } = parsed.data;

  try {
    let picker;
    if (isPreview) {
      const session = await auth();
      if (!session?.user?.id || !pickerId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      picker = await prisma.randomPicker.findFirst({
        where: { id: pickerId, authorId: session.user.id },
        select: { id: true },
      });
    } else {
      picker = await prisma.randomPicker.findFirst({
        where: { slug, status: "PUBLISHED" },
        select: { id: true },
      });
    }

    if (!picker) {
      return NextResponse.json({ error: "Random Picker tidak tersedia" }, { status: 404 });
    }

    const question = await prisma.question.findFirst({
      where: { id: questionId, randomPickerId: picker.id },
      include: { options: { orderBy: { position: "asc" } } },
    });

    if (!question) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
    }

    const base = {
      explanation: question.explanation,
      correctAnswers: [] as string[],
      correctOptionIds: [] as string[],
    };

    if (question.type === "LONG_ANSWER") {
      // Essay: nothing to grade, just confirm the answer was recorded by the client.
      return NextResponse.json({
        ...base,
        type: question.type,
        isCorrect: null,
        submittedText: typeof answerData === "string" ? answerData : "",
      });
    }

    const correctOptions = question.options.filter((o) => o.isCorrect);
    const submitted = new Set(Array.isArray(answerData) ? answerData : [answerData]);
    const isCorrect =
      correctOptions.length > 0 &&
      correctOptions.length === submitted.size &&
      correctOptions.every((o) => submitted.has(o.id));

    return NextResponse.json({
      ...base,
      type: question.type,
      isCorrect,
      correctOptionIds: correctOptions.map((o) => o.id),
      correctAnswers: correctOptions.map((o) => o.text),
    });
  } catch (error) {
    console.error("Picker answer error:", error);
    const message = error instanceof Error ? error.message : "Gagal memeriksa jawaban";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
