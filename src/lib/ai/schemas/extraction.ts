import { z } from "zod";

export const extractionSchema = z.object({
  goalDescription: z.string().nullable(),
  /** Only if user stated an amount in INR explicitly. */
  goalAmountTodayInr: z.number().positive().nullable(),
  /** Only if user stated years or clear timeline. */
  horizonYears: z.number().positive().nullable(),
  currentLumpSumInr: z.number().min(0).nullable(),
  monthlySipInr: z.number().min(0).nullable(),
  /** Only if user explicitly mentioned inflation. */
  mentionedInflationPercent: z.number().min(0).max(30).nullable(),
  /** Short verbatim quotes from user text supporting extracted numbers. */
  extractedFacts: z.array(z.string()).max(12),
  /** Fields that could not be inferred. */
  missingFields: z.array(z.string()).max(12),
  /** high = only explicit literals; low = ambiguous. */
  confidence: z.enum(["high", "medium", "low"]),
});

export type ExtractionResult = z.infer<typeof extractionSchema>;
