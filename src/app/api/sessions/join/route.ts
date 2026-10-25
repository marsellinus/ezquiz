import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
  try {
    const { joinCode: rawCode, nickname: rawNickname, className: rawClass } = await req.json();

    const joinCode = String(rawCode || "").trim().toUpperCase();
    let nickname = String(rawNickname || "").trim();
    const className = String(rawClass || "").trim();

    // Profanity Filter Helper
    const badWords = ["anjing", "babi", "kontol", "memek", "goblok", "bajingan", "pantat", "tetek", "itil", "bangsat", "peler", "fuck", "shit", "bitch", "asshole"];
    const isBadWord = badWords.some((w) => nickname.toLowerCase().includes(w));
    if (isBadWord) {
      nickname = `Peserta Ramah #${Math.floor(100 + Math.random() * 900)}`;
    }

    if (!joinCode || !nickname) {
      return NextResponse.json({ error: "Kode Game & Nickname wajib diisi" }, { status: 400 });
    }

    const session = await prisma.quizSession.findUnique({
      where: { joinCode },
      include: { quiz: true },
    });

    if (!session || session.status === "FINISHED") {
      return NextResponse.json({ error: "Kode Game tidak ditemukan atau sesi kuis telah selesai" }, { status: 404 });
    }

    const cookieStore = await cookies();
    let sessionToken = cookieStore.get(`participant_token_${session.id}`)?.value;

    if (!sessionToken) {
      sessionToken = nanoid(24);
    }

    // Upsert participant for this session
    const participant = await prisma.participant.upsert({
      where: { id: `${session.id}-${nickname}` },
      create: {
        id: `${session.id}-${nickname}`,
        sessionId: session.id,
        nickname,
        className: className || null,
        sessionToken,
      },
      update: {
        className: className || undefined,
        sessionToken,
        lastSeenAt: new Date(),
      },
    });

    cookieStore.set(`participant_token_${session.id}`, sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 24 hours
    });

    return NextResponse.json({
      session: {
        id: session.id,
        joinCode: session.joinCode,
        title: session.quiz.title,
        status: session.status,
      },
      participant,
    });
  } catch (error: any) {
    console.error("Join Error:", error);
    return NextResponse.json({ error: error.message || "Gagal bergabung ke kuis" }, { status: 500 });
  }
}
