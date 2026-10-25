import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateQuestions(topic: string, count: number = 5) {
  const prompt = `You are an expert teacher creating a quiz.
Topic: ${topic}
Number of questions: ${count}

Generate multiple choice questions in the following JSON format:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A"
  }
]
Only return valid JSON array without markdown formatting or code blocks.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "[]";
    const questions = JSON.parse(text);
    return questions;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return [];
  }
}
