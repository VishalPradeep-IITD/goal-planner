import { NextResponse } from "next/server";
import { z } from "zod";
import { buildExtractionPrompt } from "@/lib/ai/prompts/extraction";
import { extractionSchema } from "@/lib/ai/schemas/extraction";
import { generateJson } from "@/lib/ai/gemini";

const bodySchema = z.object({
  text: z.string().min(1).max(16_000),
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const { text } = bodySchema.parse(json);
    const prompt = buildExtractionPrompt(text);
    const result = await generateJson(prompt, extractionSchema);
    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Extraction failed.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 }
    );
  }
}
