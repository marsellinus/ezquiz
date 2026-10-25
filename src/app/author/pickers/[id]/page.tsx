import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { QuestionEditorClient } from "@/components/picker/QuestionEditorClient";

export default async function PickerEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const authorId = session?.user?.id;
  const { id } = await params;

  const picker = await prisma.randomPicker.findFirst({
    where: { id, authorId },
    include: {
      settings: true,
      questions: {
        orderBy: { position: "asc" },
        include: {
          attachments: true,
          links: true,
          options: { orderBy: { position: "asc" } },
        },
      },
    },
  });

  if (!picker) {
    return notFound();
  }

  // Ensure default settings exist if null, and keep only types the picker editor supports
  // (legacy rows may carry quiz-only types such as TRUE_FALSE / SHORT_ANSWER).
  const formattedPicker = {
    ...picker,
    settings: picker.settings || {
      allowRepeat: true,
      preventImmediateRepeat: true,
      noRepeatUntilAllShown: false,
      showQuestionNumber: false,
      showAttachments: true,
      showLinks: true,
    },
    questions: picker.questions.map((q) => ({
      ...q,
      type:
        q.type === "MULTIPLE_SELECT" || q.type === "LONG_ANSWER"
          ? q.type
          : ("MULTIPLE_CHOICE" as const),
      explanation: q.explanation ?? "",
    })),
  };

  return <QuestionEditorClient initialPicker={formattedPicker} />;
}
