import { z } from "zod";

export const scenarioSchema = z.enum(["conservative", "balanced", "aggressive"]);

function coerceFiniteNumber(val: unknown): number {
  if (typeof val === "number" && Number.isFinite(val)) return val;
  if (typeof val === "string" && val.trim() !== "") {
    const cleaned = val.replace(/,/g, "").replace(/\s/g, "").trim();
    const n = Number(cleaned);
    if (Number.isFinite(n)) return n;
  }
  return NaN;
}

export const goalFormSchema = z.object({
  goalDescription: z.string().min(1, "Describe your goal."),
  goalAmountTodayInr: z.preprocess(
    coerceFiniteNumber,
    z.number().positive("Enter a positive target (today's cost).")
  ),
  horizonYears: z.preprocess(
    coerceFiniteNumber,
    z
      .number()
      .min(0.25, "Horizon must be at least 3 months.")
      .max(50, "Horizon capped at 50 years for this demo.")
  ),
  currentLumpSumInr: z.preprocess(
    coerceFiniteNumber,
    z.number().min(0, "Cannot be negative.")
  ),
  monthlySipInr: z.preprocess(
    coerceFiniteNumber,
    z.number().min(0, "Cannot be negative.")
  ),
  scenario: scenarioSchema,
});

export type GoalFormValues = z.infer<typeof goalFormSchema>;

export const defaultGoalFormValues: GoalFormValues = {
  goalDescription: "Child education fund",
  goalAmountTodayInr: 25_00_000,
  horizonYears: 8,
  currentLumpSumInr: 2_00_000,
  monthlySipInr: 0,
  scenario: "balanced",
};
