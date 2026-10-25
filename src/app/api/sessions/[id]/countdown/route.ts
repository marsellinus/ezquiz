import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await auth();
  if (!sessionUser?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const session = await prisma.quizSession.findUnique({
      where: { id },
      include: { quiz: { select: { authorId: true } } },
    });

    if (!session) {
      return NextResponse.json({ error: "Sesi tidak ditemukan" }, { status: 404 });
    }

    if (session.quiz.authorId !== sessionUser.user.id) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const updated = await prisma.quizSession.update({
      where: { id },
      data: {
        status: "COUNTDOWN",
      },
    });

    return NextResponse.json({ session: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal memulai countdown" }, { status: 500 });
  }
}
