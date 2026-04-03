const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const inrCompact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export function formatInr(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return inrFormatter.format(Math.round(amount));
}

export function formatInrCompact(amount: number): string {
  if (!Number.isFinite(amount)) return "—";
  return inrCompact.format(amount);
}

export function formatPercent(decimal: number, digits = 1): string {
  if (!Number.isFinite(decimal)) return "—";
  return `${(decimal * 100).toFixed(digits)}%`;
}
