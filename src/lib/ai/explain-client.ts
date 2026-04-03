import type { ComputedSummary } from "@/lib/types/plan";
import { buildExplainPrompt } from "@/lib/ai/prompts/explain";
import { explainSchema } from "@/lib/ai/schemas/explain";
import { generateJsonClient } from "@/lib/ai/gemini-client";

export async function explainPlanInBrowser(input: {
  goalDescription: string;
  scenarioLabel: string;
  summary: ComputedSummary;
}): Promise<{ summary: string; bullets?: string[] }> {
  const prompt = buildExplainPrompt(
    {
      goalDescription: input.goalDescription,
      scenarioLabel: input.scenarioLabel,
    },
    input.summary
  );
  return generateJsonClient(prompt, explainSchema);
}
