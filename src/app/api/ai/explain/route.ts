import { NextResponse } from "next/server";
import { z } from "zod";
import { buildExplainPrompt } from "@/lib/ai/prompts/explain";
import { explainSchema } from "@/lib/ai/schemas/explain";
import { generateJson } from "@/lib/ai/gemini";
import { computedSummarySchema } from "@/lib/ai/schemas/plan-payload";

const bodySchema = z.object({
  goalDescription: z.string().min(1),
  scenarioLabel: z.string().min(1),
  summary: computedSummarySchema,
});

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = bodySchema.parse(json);
    const prompt = buildExplainPrompt(
      {
        goalDescription: parsed.goalDescription,
        scenarioLabel: parsed.scenarioLabel,
      },
      parsed.summary
    );
    const result = await generateJson(prompt, explainSchema);
    return NextResponse.json({ ok: true, data: result });
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "Explanation failed.";
    return NextResponse.json(
      { ok: false, error: message },
      { status: 400 }
    );
  }
}
