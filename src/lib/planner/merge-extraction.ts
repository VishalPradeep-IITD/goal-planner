import type { ExtractionResult } from "@/lib/ai/schemas/extraction";
import type { GoalFormValues } from "@/lib/validation/goal-form";

export interface MergeExtractionResult {
  values: GoalFormValues;
  warnings: string[];
}

export function mergeExtractionIntoForm(
  current: GoalFormValues,
  extracted: ExtractionResult
): MergeExtractionResult {
  const values: Partial<GoalFormValues> = {};
  const warnings: string[] = [];

  if (extracted.goalDescription?.trim()) {
    values.goalDescription = extracted.goalDescription.trim();
  }

  if (extracted.goalAmountTodayInr != null) {
    values.goalAmountTodayInr = extracted.goalAmountTodayInr;
  } else {
    warnings.push(
      "Target amount (today's cost) was not clearly stated — please enter it."
    );
  }

  if (extracted.horizonYears != null) {
    values.horizonYears = extracted.horizonYears;
  } else {
    warnings.push(
      "Time horizon was not clearly stated — please enter years to goal."
    );
  }

  if (extracted.currentLumpSumInr != null) {
    values.currentLumpSumInr = extracted.currentLumpSumInr;
  }

  if (extracted.monthlySipInr != null) {
    values.monthlySipInr = extracted.monthlySipInr;
  }

  if (extracted.missingFields.length > 0) {
    warnings.push(...extracted.missingFields.map((f) => `Missing: ${f}`));
  }

  if (extracted.confidence === "low") {
    warnings.push(
      "Extraction confidence is low — double-check all numbers in the form."
    );
  }

  const merged: GoalFormValues = { ...current, ...values };
  return { values: merged, warnings };
}
