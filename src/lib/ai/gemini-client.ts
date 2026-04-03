import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";

function stripJsonFence(text: string): string {
  const t = text.trim();
  if (t.startsWith("```")) {
    return t.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "");
  }
  return t;
}

/**
 * Runs Gemini JSON generation in the browser using `NEXT_PUBLIC_GEMINI_API_KEY`
 * (required for static hosts like GitHub Pages that cannot run API routes).
 */
export async function generateJsonClient<T>(
  prompt: string,
  schema: z.ZodType<T>
): Promise<T> {
  const key = process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim();
  if (!key) {
    throw new Error("NEXT_PUBLIC_GEMINI_API_KEY is not configured.");
  }
  const modelName =
    process.env.NEXT_PUBLIC_GEMINI_MODEL?.trim() ??
    "gemini-2.5-flash-lite";
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
    },
  });
  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const raw = stripJsonFence(text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Model returned non-JSON output.");
  }
  return schema.parse(parsed);
}
