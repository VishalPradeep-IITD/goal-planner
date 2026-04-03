import { z } from "zod";

export const computedSummarySchema = z.object({
  futureNominalTargetInr: z.number(),
  goalInTodaysRupeesInr: z.number(),
  projectedCorpusInr: z.number(),
  requiredMonthlySipInr: z.number(),
  surplusOrShortfallInr: z.number(),
  annualNominalReturn: z.number(),
  annualInflation: z.number(),
  horizonYears: z.number(),
  effectiveAnnualReturn: z.number().optional(),
});
