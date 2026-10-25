import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { nanoid } from "nanoid";

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
    const existing = await prisma.randomPicker.findFirst({
      where: { id, authorId: session.user.id },
      include: {
        settings: true,
        questions: {
          include: {
            attachments: true,
            links: true,
            options: { orderBy: { position: "asc" } },
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Random Picker tidak ditemukan" }, { status: 404 });
    }

    const newSlug = nanoid(10);

    // Duplicate Picker with all questions, attachments, links & settings
    const duplicated = await prisma.randomPicker.create({
      data: {
        authorId: session.user.id,
        title: `${existing.title} (Copy)`,
        description: existing.description,
        slug: newSlug,
        status: "DRAFT",
        settings: existing.settings
          ? {
              create: {
                allowRepeat: existing.settings.allowRepeat,
                preventImmediateRepeat: existing.settings.preventImmediateRepeat,
                noRepeatUntilAllShown: existing.settings.noRepeatUntilAllShown,
                showQuestionNumber: existing.settings.showQuestionNumber,
                showAttachments: existing.settings.showAttachments,
                showLinks: existing.settings.showLinks,
              },
            }
          : undefined,
        questions: {
          create: existing.questions.map((q) => ({
            content: q.content,
            position: q.position,
            isActive: q.isActive,
            type: q.type,
            explanation: q.explanation,
            options: {
              create: q.options.map((o) => ({
                text: o.text,
                isCorrect: o.isCorrect,
                position: o.position,
              })),
            },
            attachments: {
              create: q.attachments.map((a) => ({
                type: a.type,
                fileName: a.fileName,
                fileUrl: a.fileUrl,
                mimeType: a.mimeType,
                fileSize: a.fileSize,
              })),
            },
            links: {
              create: q.links.map((l) => ({
                title: l.title,
                url: l.url,
              })),
            },
          })),
        },
      },
    });

    return NextResponse.json({
      message: "Random Picker berhasil diduplikasi!",
      picker: duplicated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Gagal menduplikasi" }, { status: 500 });
  }
}
