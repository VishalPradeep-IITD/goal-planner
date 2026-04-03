/**
 * Monthly rate from annual nominal return (simple /12 — common SIP convention).
 */
export function annualToMonthlyRate(annualNominal: number): number {
  return annualNominal / 12;
}

/**
 * Future value of a lump sum compounded monthly.
 * FV = P * (1 + r_m)^n
 */
export function futureValueLumpSum(
  principal: number,
  annualNominalReturn: number,
  months: number
): number {
  if (months <= 0) return principal;
  const rm = annualToMonthlyRate(annualNominalReturn);
  return principal * Math.pow(1 + rm, months);
}

/**
 * Future value of an ordinary monthly SIP (payment at end of month).
 * FV = PMT * [((1+r)^n - 1) / r]
 */
export function futureValueSip(
  monthlyPayment: number,
  annualNominalReturn: number,
  months: number
): number {
  if (months <= 0) return 0;
  const rm = annualToMonthlyRate(annualNominalReturn);
  if (rm === 0) return monthlyPayment * months;
  return (
    monthlyPayment * ((Math.pow(1 + rm, months) - 1) / rm)
  );
}

/**
 * Nominal cost at goal date if today's cost compounds at inflation.
 * (Today's rupee goal inflated to nominal future amount.)
 */
export function futureNominalFromTodayCost(
  costTodayInr: number,
  annualInflation: number,
  years: number
): number {
  return costTodayInr * Math.pow(1 + annualInflation, years);
}
