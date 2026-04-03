"use client";

import type { GoalInputs } from "@/lib/types/plan";
import type { ComputedSummary } from "@/lib/types/plan";
import type { PlanSnapshot } from "@/lib/types/plan";

const STORAGE_KEY = "ai-fgp-plans-v1";

function safeParse(raw: string | null): PlanSnapshot[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    if (!Array.isArray(data)) return [];
    return data.filter(isPlanSnapshot);
  } catch {
    return [];
  }
}

function isPlanSnapshot(x: unknown): x is PlanSnapshot {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o.id === "string" &&
    typeof o.createdAt === "string" &&
    o.inputs !== undefined &&
    o.summary !== undefined
  );
}

export function listPlans(): PlanSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(localStorage.getItem(STORAGE_KEY)).sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch {
    return [];
  }
}

export function savePlan(snapshot: Omit<PlanSnapshot, "id" | "createdAt"> & { id?: string }): PlanSnapshot {
  const id = snapshot.id ?? crypto.randomUUID();
  const createdAt = new Date().toISOString();
  const full: PlanSnapshot = {
    ...snapshot,
    id,
    createdAt,
  };
  const existing = listPlans();
  const next = [full, ...existing.filter((p) => p.id !== id)];
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    throw new Error("Could not save plan (storage unavailable).");
  }
  return full;
}

export function getPlan(id: string): PlanSnapshot | undefined {
  return listPlans().find((p) => p.id === id);
}

export function deletePlan(id: string): void {
  const next = listPlans().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
}

export function buildSnapshotFromPlanner(params: {
  inputs: GoalInputs;
  summary: ComputedSummary;
  explanation?: string;
  suggestions?: string[];
}): Omit<PlanSnapshot, "id" | "createdAt"> {
  return {
    inputs: params.inputs,
    summary: params.summary,
    explanation: params.explanation,
    suggestions: params.suggestions,
  };
}
