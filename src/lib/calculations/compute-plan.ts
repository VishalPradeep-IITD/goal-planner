import { getScenarioAssumptions } from "@/lib/calculations/assumptions";
import { futureNominalFromTodayCost } from "@/lib/calculations/fv";
import {
  projectedCorpus,
  requiredMonthlySip,
} from "@/lib/calculations/sip";
import type { ComputedSummary, GoalInputs } from "@/lib/types/plan";

export function computePlanSummary(
  inputs: GoalInputs,
  options?: { annualReturnOverride?: number }
): ComputedSummary {
  const scenario = getScenarioAssumptions(inputs.scenario);
  const annualNominalReturn =
    options?.annualReturnOverride ?? scenario.annualNominalReturn;
  const months = Math.max(0, Math.round(inputs.horizonYears * 12));

  const futureNominalTargetInr = futureNominalFromTodayCost(
    inputs.goalAmountTodayInr,
    scenario.annualInflation,
    inputs.horizonYears
  );

  const projectedCorpusInr = projectedCorpus(
    inputs.currentLumpSumInr,
    inputs.monthlySipInr,
    annualNominalReturn,
    months
  );

  const requiredMonthlySipInr = requiredMonthlySip(
    futureNominalTargetInr,
    inputs.currentLumpSumInr,
    annualNominalReturn,
    months
  );

  const surplusOrShortfallInr = projectedCorpusInr - futureNominalTargetInr;

  return {
    futureNominalTargetInr,
    goalInTodaysRupeesInr: inputs.goalAmountTodayInr,
    projectedCorpusInr,
    requiredMonthlySipInr,
    surplusOrShortfallInr,
    annualNominalReturn,
    annualInflation: scenario.annualInflation,
    horizonYears: inputs.horizonYears,
    effectiveAnnualReturn: options?.annualReturnOverride,
  };
}
