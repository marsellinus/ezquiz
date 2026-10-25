import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const attachmentSchema = z.object({
  type: z.enum(["IMAGE", "VIDEO", "FILE"]),
  fileName: z.string(),
  fileUrl: z.string(),
  mimeType: z.string(),
  fileSize: z.number().int().nonnegative(),
});

const linkSchema = z.object({
  title: z.string(),
  url: z.string(),
});

const optionSchema = z.object({
  text: z.string(),
  isCorrect: z.boolean().default(false),
});

const questionSchema = z.object({
  id: z.string(),
  type: z.enum(["MULTIPLE_CHOICE", "MULTIPLE_SELECT", "LONG_ANSWER"]).default("MULTIPLE_CHOICE"),
  content: z.string(),
  explanation: z.string().nullish(),
  isActive: z.boolean().default(true),
  options: z.array(optionSchema).default([]),
  attachments: z.array(attachmentSchema).default([]),
  links: z.array(linkSchema).default([]),
});

const settingsSchema = z.object({
  allowRepeat: z.boolean().default(true),
  preventImmediateRepeat: z.boolean().default(true),
  noRepeatUntilAllShown: z.boolean().default(false),
  showQuestionNumber: z.boolean().default(false),
  showAttachments: z.boolean().default(true),
  showLinks: z.boolean().default(true),
});

const patchSchema = z.object({
  title: z.string().optional(),
  description: z.string().nullish(),
  settings: settingsSchema.optional(),
  questions: z.array(questionSchema).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const parsed = patchSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || "Data tidak valid" },
        { status: 400 }
      );
    }

    const { title, description, settings, questions } = parsed.data;

    // Verify ownership
    const existing = await prisma.randomPicker.findFirst({
      where: { id, authorId: session.user.id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Picker tidak ditemukan" }, { status: 404 });
    }

    // Transaction for atomic update
    await prisma.$transaction(async (tx) => {
      // 1. Update basic info
      await tx.randomPicker.update({
        where: { id },
        data: {
          title,
          description: description === undefined ? undefined : description || null,
        },
      });

      // 2. Upsert settings
      if (settings) {
        await tx.randomPickerSettings.upsert({
          where: { randomPickerId: id },
          create: {
            randomPickerId: id,
            ...settings,
          },
          update: settings,
        });
      }

      // 3. Upsert / Delete Questions
      if (questions) {
        const existingQuestions = await tx.question.findMany({
          where: { randomPickerId: id },
          select: { id: true },
        });

        const currentIds = questions.filter((q) => !q.id.startsWith("temp-")).map((q) => q.id);
        const idsToDelete = existingQuestions.map((q) => q.id).filter((qid) => !currentIds.includes(qid));

        if (idsToDelete.length > 0) {
          await tx.question.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }

        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const isTemp = q.id.startsWith("temp-");
          // Only options with text become answer choices; blank rows are dropped.
          const options = q.type === "LONG_ANSWER" ? [] : q.options.filter((o) => o.text.trim().length > 0);

          if (isTemp) {
            // Create question with options, attachments & links
            await tx.question.create({
              data: {
                randomPickerId: id,
                type: q.type,
                content: q.content,
                explanation: q.explanation || null,
                position: i + 1,
                isActive: q.isActive,
                options: options.length
                  ? {
                      create: options.map((o, pos) => ({
                        text: o.text,
                        isCorrect: o.isCorrect,
                        position: pos + 1,
                      })),
                    }
                  : undefined,
                attachments: q.attachments.length
                  ? {
                      create: q.attachments.map((a) => ({
                        type: a.type,
                        fileName: a.fileName,
                        fileUrl: a.fileUrl,
                        mimeType: a.mimeType,
                        fileSize: a.fileSize,
                      })),
                    }
                  : undefined,
                links: q.links.length
                  ? {
                      create: q.links.map((l) => ({
                        title: l.title,
                        url: l.url,
                      })),
                    }
                  : undefined,
              },
            });
          } else {
            // Update question
            await tx.question.update({
              where: { id: q.id },
              data: {
                type: q.type,
                content: q.content,
                explanation: q.explanation || null,
                position: i + 1,
                isActive: q.isActive,
              },
            });

            // Replace options (ids are regenerated; answers are not stored per option)
            await tx.questionOption.deleteMany({ where: { questionId: q.id } });
            if (options.length) {
              await tx.questionOption.createMany({
                data: options.map((o, pos) => ({
                  questionId: q.id,
                  text: o.text,
                  isCorrect: o.isCorrect,
                  position: pos + 1,
                })),
              });
            }

            // Replace attachments
            await tx.questionAttachment.deleteMany({ where: { questionId: q.id } });
            if (q.attachments.length) {
              await tx.questionAttachment.createMany({
                data: q.attachments.map((a) => ({
                  questionId: q.id,
                  type: a.type,
                  fileName: a.fileName,
                  fileUrl: a.fileUrl,
                  mimeType: a.mimeType,
                  fileSize: a.fileSize,
                })),
              });
            }

            // Replace links
            await tx.questionLink.deleteMany({ where: { questionId: q.id } });
            if (q.links.length) {
              await tx.questionLink.createMany({
                data: q.links.map((l) => ({
                  questionId: q.id,
                  title: l.title,
                  url: l.url,
                })),
              });
            }
          }
        }
      }
    });

    return NextResponse.json({ message: "Berhasil disimpan!" });
  } catch (error) {
    console.error("PATCH error:", error);
    const message = error instanceof Error ? error.message : "Gagal menyimpan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
