import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { questionId, answerData, responseTime, points: basePoints, timeLimit, scoringType } = await req.json();

    if (!questionId) {
      return NextResponse.json({ error: "questionId is required" }, { status: 400 });
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: { options: true },
    });

    if (!question) {
      return NextResponse.json({ error: "Soal tidak ditemukan" }, { status: 404 });
    }

    let isCorrect = false;

    if (question.type === "MULTIPLE_CHOICE" || question.type === "TRUE_FALSE") {
      const correctOption = question.options.find((o) => o.isCorrect);
      isCorrect = (answerData === correctOption?.id || answerData === correctOption?.text);
    } else if (question.type === "MULTIPLE_SELECT") {
      const correctOptionIds = new Set(question.options.filter((o) => o.isCorrect).map((o) => o.id));
      const submittedIds = new Set(Array.isArray(answerData) ? answerData : []);

      if (correctOptionIds.size === submittedIds.size && [...correctOptionIds].every((id) => submittedIds.has(id))) {
        isCorrect = true;
      }
    } else if (question.type === "SHORT_ANSWER") {
      const submittedText = String(answerData || "").trim().toLowerCase();
      const validTexts = question.options.map((o) => o.text.trim().toLowerCase());
      isCorrect = validTexts.includes(submittedText);
    }

    // Speed bonus calculation (Server-Side)
    let awardedPoints = 0;
    if (isCorrect) {
      const maxPoints = basePoints || 100;
      if (scoringType === "FIXED") {
        awardedPoints = maxPoints;
      } else {
        // DYNAMIC / SPEED BONUS: Siapa Cepat Dia Dapat (Hingga +50% Bonus Poin)
        const totalTime = timeLimit || 30;
        const remainingTime = Math.max(0, totalTime - (responseTime || 0));
        const speedBonus = Math.round(maxPoints * 0.5 * (remainingTime / totalTime));
        awardedPoints = maxPoints + speedBonus;
      }
    }

    const correctOptions = question.options.filter((o) => o.isCorrect).map((o) => o.text);

    return NextResponse.json({
      isCorrect,
      awardedPoints,
      correctAnswers: correctOptions,
      explanation: question.explanation,
    });
  } catch (error: any) {
    console.error("Answer evaluation error:", error);
    return NextResponse.json({ error: error.message || "Error processing answer" }, { status: 500 });
  }
}
