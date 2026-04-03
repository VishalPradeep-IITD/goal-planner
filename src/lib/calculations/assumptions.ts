import type { ScenarioKey } from "@/lib/types/plan";

export interface ScenarioAssumptions {
  key: ScenarioKey;
  label: string;
  description: string;
  /** Expected portfolio return (nominal, annual). */
  annualNominalReturn: number;
  /** CPI / education inflation (annual). */
  annualInflation: number;
  notionalEquityWeight: number;
}

const SCENARIOS: Record<ScenarioKey, ScenarioAssumptions> = {
  conservative: {
    key: "conservative",
    label: "Conservative",
    description: "Higher debt allocation; lower volatility and lower expected return.",
    annualNominalReturn: 0.07,
    annualInflation: 0.06,
    notionalEquityWeight: 0.35,
  },
  balanced: {
    key: "balanced",
    label: "Balanced",
    description: "Mixed equity and debt; moderate risk.",
    annualNominalReturn: 0.1,
    annualInflation: 0.06,
    notionalEquityWeight: 0.6,
  },
  aggressive: {
    key: "aggressive",
    label: "Aggressive",
    description: "Higher equity tilt; higher expected volatility and return.",
    annualNominalReturn: 0.12,
    annualInflation: 0.06,
    notionalEquityWeight: 0.85,
  },
};

export function getScenarioAssumptions(scenario: ScenarioKey): ScenarioAssumptions {
  return SCENARIOS[scenario];
}

export function listScenarios(): ScenarioAssumptions[] {
  return [SCENARIOS.conservative, SCENARIOS.balanced, SCENARIOS.aggressive];
}
