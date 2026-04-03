import type { ComputedSummary } from "@/lib/types/plan";
import { formatInr, formatPercent } from "@/lib/format/inr";

export function buildExplainPrompt(
  inputs: {
    goalDescription: string;
    scenarioLabel: string;
  },
  summary: ComputedSummary
): string {
  const figures = `
Scenario: ${inputs.scenarioLabel}
Goal (description): ${inputs.goalDescription}
Goal cost in today's rupees: ${formatInr(summary.goalInTodaysRupeesInr)}
Horizon (years): ${summary.horizonYears}
Assumed annual inflation (for goal cost): ${formatPercent(summary.annualInflation)}
Assumed annual portfolio return (nominal): ${formatPercent(summary.annualNominalReturn)}
${summary.effectiveAnnualReturn != null ? `Return override applied: ${formatPercent(summary.effectiveAnnualReturn)}` : ""}

Estimated nominal goal cost at goal date: ${formatInr(summary.futureNominalTargetInr)}
Projected corpus at goal date: ${formatInr(summary.projectedCorpusInr)}
Required monthly SIP (to close gap from current lump sum): ${formatInr(summary.requiredMonthlySipInr)}
Surplus (+) or shortfall (-) vs target: ${formatInr(summary.surplusOrShortfallInr)}
`.trim();

  return `You are an Indian personal finance planning assistant. Your job is to explain the plan and help the user improve their odds of reaching the goal.

Rules:
- Use ONLY the figures provided below. Do not invent or adjust numbers.
- Do not recommend specific funds, schemes, stocks, or products.
- Give practical guidance using only these levers: increase SIP, extend timeline, build or preserve lump sum, choose a more realistic path, and review progress regularly.
- If the plan has a shortfall, clearly say what kind of action would help most.
- If the plan is on track, suggest how to stay on track and build a small safety buffer.
- Mention that returns and inflation are assumptions, not guarantees.
- Keep it concise and helpful.
- The "summary" should be 2 short paragraphs in plain English.
- The "bullets" should be 3 to 5 actionable tips, recommendations, or next steps.
- Make the bullets specific to the figures provided, not generic investing advice.
- Output ONLY valid JSON with keys "summary" (string) and optional "bullets" (string[]).

Figures:
${figures}`;
}
