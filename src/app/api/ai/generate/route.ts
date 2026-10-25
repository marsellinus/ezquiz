import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API Key Gemini belum terkonfigurasi di server." }, { status: 500 });
  }

  try {
    const { topic, difficulty, count, type } = await req.json();

    if (!topic) {
      return NextResponse.json({ error: "Topik tidak boleh kosong" }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey });
    
    const prompt = `Generate ${count || 5} high quality quiz questions about "${topic}".
Difficulty level: ${difficulty || "Medium"}.
Question Type: ${type || "MULTIPLE_CHOICE"}.

Return ONLY a valid JSON array of objects with the following format:
[
  {
    "type": "MULTIPLE_CHOICE",
    "content": "Question text here?",
    "explanation": "Brief explanation of the correct answer.",
    "points": 100,
    "timeLimit": 30,
    "options": [
      { "text": "Option A", "isCorrect": false },
      { "text": "Option B", "isCorrect": true },
      { "text": "Option C", "isCorrect": false },
      { "text": "Option D", "isCorrect": false }
    ]
  }
]

Make sure JSON is valid, raw JSON output without markdown backticks.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    let rawText = response.text || "";
    // Clean codeblock markdown if present
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    const questions = JSON.parse(rawText);

    return NextResponse.json({ questions });
  } catch (error: any) {
    console.error("AI Generation error:", error);
    return NextResponse.json({ error: error.message || "Gagal membuat soal dengan AI" }, { status: 500 });
  }
}
