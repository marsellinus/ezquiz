import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: sessionId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(`participant_token_${sessionId}`)?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: "Participant token missing" }, { status: 401 });
    }

    const participant = await prisma.participant.findFirst({
      where: { sessionId, sessionToken },
    });

    if (!participant) {
      return NextResponse.json({ error: "Participant not found" }, { status: 404 });
    }

    // Increment tab switch count
    const updated = await prisma.participant.update({
      where: { id: participant.id },
      data: {
        tabSwitchCount: { increment: 1 },
      } as any,
    });

    return NextResponse.json({ success: true, tabSwitchCount: (updated as any).tabSwitchCount });
  } catch (error: any) {
    console.error("Tab switch error:", error);
    return NextResponse.json({ error: error.message || "Failed to log tab switch" }, { status: 500 });
  }
}
