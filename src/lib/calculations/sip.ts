import { futureValueLumpSum, futureValueSip } from "@/lib/calculations/fv";

/**
 * Required monthly SIP to reach `targetFv` given lump sum already invested,
 * using the same annual return for both lump and SIP.
 */
export function requiredMonthlySip(
  targetFutureValue: number,
  lumpSumInr: number,
  annualNominalReturn: number,
  months: number
): number {
  if (months <= 0) return 0;
  const fvLump = futureValueLumpSum(lumpSumInr, annualNominalReturn, months);
  const gap = Math.max(0, targetFutureValue - fvLump);
  const rm = annualNominalReturn / 12;
  if (rm === 0) return gap / months;
  const annuityFactor = (Math.pow(1 + rm, months) - 1) / rm;
  if (annuityFactor <= 0) return 0;
  return gap / annuityFactor;
}

/**
 * Total FV at horizon from lump + SIP.
 */
export function projectedCorpus(
  lumpSumInr: number,
  monthlySipInr: number,
  annualNominalReturn: number,
  months: number
): number {
  return (
    futureValueLumpSum(lumpSumInr, annualNominalReturn, months) +
    futureValueSip(monthlySipInr, annualNominalReturn, months)
  );
}
