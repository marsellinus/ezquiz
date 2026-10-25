import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const sessionUser = await auth();
    const authorId = sessionUser?.user?.id;
    if (!authorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: sessionId } = await params;
    const { participantId } = await req.json();

    if (!participantId) {
      return NextResponse.json({ error: "Participant ID wajib diisi" }, { status: 400 });
    }

    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
      include: { quiz: true },
    });

    if (!session || session.quiz.authorId !== authorId) {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    // Only remove participants that actually belong to this session
    const participant = await prisma.participant.findFirst({
      where: { id: participantId, sessionId },
      select: { id: true },
    });

    if (!participant) {
      return NextResponse.json({ error: "Peserta tidak ditemukan di sesi ini" }, { status: 404 });
    }

    await prisma.participant.delete({
      where: { id: participant.id },
    });

    return NextResponse.json({ success: true, message: "Peserta berhasil dikeluarkan" });
  } catch (error: any) {
    console.error("Kick Participant Error:", error);
    return NextResponse.json({ error: error.message || "Gagal mengeluarkan peserta" }, { status: 500 });
  }
}
