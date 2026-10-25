import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

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
    const quiz = await prisma.quiz.findFirst({
      where: { id, authorId: session.user.id },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz tidak ditemukan" }, { status: 404 });
    }

    let joinCode = generateJoinCode();
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const existing = await prisma.quizSession.findUnique({ where: { joinCode } });
      if (!existing) break;
      joinCode = generateJoinCode();
      attempts++;
    }

    const newSession = await prisma.quizSession.create({
      data: {
        quizId: id,
        joinCode,
        status: "WAITING",
      },
    });

    return NextResponse.json({ session: newSession });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal membuat live session" }, { status: 500 });
  }
}
