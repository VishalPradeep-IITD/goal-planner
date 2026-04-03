import { futureValueLumpSum, futureValueSip } from "@/lib/calculations/fv";

export interface CorpusPoint {
  month: number;
  yearFraction: number;
  corpusInr: number;
}

/**
 * Month-end corpus trajectory for charting (lump + SIP accumulating).
 */
export function projectCorpusSeries(params: {
  lumpSumInr: number;
  monthlySipInr: number;
  annualNominalReturn: number;
  totalMonths: number;
  /** Sample every N months to keep chart light (e.g. 3 = quarterly). */
  stepMonths?: number;
}): CorpusPoint[] {
  const {
    lumpSumInr,
    monthlySipInr,
    annualNominalReturn,
    totalMonths,
    stepMonths = 1,
  } = params;
  const points: CorpusPoint[] = [];
  for (let m = 0; m <= totalMonths; m += stepMonths) {
    const corpus =
      futureValueLumpSum(lumpSumInr, annualNominalReturn, m) +
      futureValueSip(monthlySipInr, annualNominalReturn, m);
    points.push({
      month: m,
      yearFraction: m / 12,
      corpusInr: corpus,
    });
  }
  if (totalMonths % stepMonths !== 0) {
    const m = totalMonths;
    const corpus =
      futureValueLumpSum(lumpSumInr, annualNominalReturn, m) +
      futureValueSip(monthlySipInr, annualNominalReturn, m);
    points.push({
      month: m,
      yearFraction: m / 12,
      corpusInr: corpus,
    });
  }
  return points;
}
