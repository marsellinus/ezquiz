import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { nanoid } from "nanoid";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const cookieStore = await cookies();
  
  // Anonymous session cookie handling
  let sessionId = cookieStore.get("picker_session_id")?.value;
  if (!sessionId) {
    sessionId = nanoid(16);
    cookieStore.set("picker_session_id", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const isPreview = body?.isPreview === true;
    const pickerIdOverride = body?.pickerId;

    let picker;
    if (isPreview && pickerIdOverride) {
      picker = await prisma.randomPicker.findUnique({
        where: { id: pickerIdOverride },
        include: { settings: true },
      });
    } else {
      picker = await prisma.randomPicker.findUnique({
        where: { slug },
        include: { settings: true },
      });
    }

    if (!picker || (!isPreview && picker.status !== "PUBLISHED")) {
      return NextResponse.json({ error: "Random Picker tidak tersedia" }, { status: 404 });
    }

    const settings = picker.settings || {
      allowRepeat: true,
      preventImmediateRepeat: true,
      noRepeatUntilAllShown: false,
      showQuestionNumber: false,
      showAttachments: true,
      showLinks: true,
    };

    const activeQuestions = await prisma.question.findMany({
      where: { randomPickerId: picker.id, isActive: true },
      include: {
        attachments: true,
        links: true,
        options: {
          orderBy: { position: "asc" },
          select: { id: true, text: true },
        },
      },
      orderBy: { position: "asc" },
    });

    if (activeQuestions.length === 0) {
      return NextResponse.json({ error: "Belum ada soal yang tersedia" }, { status: 404 });
    }

    let candidateQuestions = [...activeQuestions];

    if (!isPreview) {
      // 1. Check No-Repeat Until All Shown mode
      if (settings.noRepeatUntilAllShown) {
        const historyEntries = await prisma.randomPickHistory.findMany({
          where: { randomPickerId: picker.id, sessionId },
          select: { questionId: true },
        });

        const pickedIds = new Set(historyEntries.map((h) => h.questionId));
        const unpickedCandidates = candidateQuestions.filter((q) => !pickedIds.has(q.id));

        if (unpickedCandidates.length > 0) {
          candidateQuestions = unpickedCandidates;
        } else {
          // Reset cycle history for this session if all questions were shown
          await prisma.randomPickHistory.deleteMany({
            where: { randomPickerId: picker.id, sessionId },
          });
        }
      } 
      // 2. Check Prevent Immediate Repeat mode
      else if (settings.preventImmediateRepeat && candidateQuestions.length > 1) {
        const lastPicked = await prisma.randomPickHistory.findFirst({
          where: { randomPickerId: picker.id, sessionId },
          orderBy: { pickedAt: "desc" },
        });

        if (lastPicked) {
          const filtered = candidateQuestions.filter((q) => q.id !== lastPicked.questionId);
          if (filtered.length > 0) {
            candidateQuestions = filtered;
          }
        }
      }
    }

    // Select 1 Random Question Server-Side
    const randomIndex = Math.floor(Math.random() * candidateQuestions.length);
    const selectedQuestion = candidateQuestions[randomIndex];

    // Record Pick History (if not in preview)
    if (!isPreview) {
      await prisma.randomPickHistory.create({
        data: {
          randomPickerId: picker.id,
          questionId: selectedQuestion.id,
          sessionId,
        },
      });
    }

    // Sanitize response based on settings
    const sanitizedQuestion = {
      id: selectedQuestion.id,
      content: selectedQuestion.content,
      positionNumber: settings.showQuestionNumber ? selectedQuestion.position : undefined,
      attachments: settings.showAttachments
        ? selectedQuestion.attachments.map((a) => ({
            type: a.type,
            fileName: a.fileName,
            fileUrl: a.fileUrl,
            mimeType: a.mimeType,
            fileSize: a.fileSize,
          }))
        : [],
      links: settings.showLinks
        ? selectedQuestion.links.map((l) => ({
            title: l.title,
            url: l.url,
          }))
        : [],
      options: selectedQuestion.options || [],
      type: selectedQuestion.type,
    };

    return NextResponse.json({
      question: sanitizedQuestion,
    });
  } catch (error: any) {
    console.error("Public Shuffle Error:", error);
    return NextResponse.json({ error: error.message || "Terjadi kesalahan server" }, { status: 500 });
  }
}
