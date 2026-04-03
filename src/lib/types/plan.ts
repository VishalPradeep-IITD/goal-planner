export type ScenarioKey = "conservative" | "balanced" | "aggressive";

export interface GoalInputs {
  goalDescription: string;
  /** Cost of the goal expressed in today's rupees (purchasing power). */
  goalAmountTodayInr: number;
  horizonYears: number;
  currentLumpSumInr: number;
  monthlySipInr: number;
  scenario: ScenarioKey;
}

export interface ComputedSummary {
  /** Nominal rupees needed at goal date (goal in today's money inflated). */
  futureNominalTargetInr: number;
  /** Today's-rupee goal (input echoed for clarity). */
  goalInTodaysRupeesInr: number;
  projectedCorpusInr: number;
  requiredMonthlySipInr: number;
  surplusOrShortfallInr: number;
  annualNominalReturn: number;
  annualInflation: number;
  horizonYears: number;
  /** Optional override for what-if (annual, decimal e.g. 0.1) */
  effectiveAnnualReturn?: number;
}

export interface PlanSnapshot {
  id: string;
  createdAt: string;
  inputs: GoalInputs;
  summary: ComputedSummary;
  /** Cached AI copy for demo offline viewing */
  explanation?: string;
  suggestions?: string[];
}
