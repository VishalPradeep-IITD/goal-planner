const integerFormat = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
  minimumFractionDigits: 0,
});

export function parseLocaleNumberString(s: string): number | undefined {
  const t = s.replace(/,/g, "").replace(/\s/g, "").trim();
  if (t === "" || t === "-" || t === "." || t === "-.") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

export function formatIntegerInput(n: number): string {
  if (!Number.isFinite(n)) return "";
  return integerFormat.format(Math.round(n));
}

export function formatDecimalInput(n: number, maxFrac = 2): string {
  if (!Number.isFinite(n)) return "";
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: maxFrac,
    minimumFractionDigits: 0,
  }).format(n);
}
