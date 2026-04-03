"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Trash2, FolderOpen } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatInr } from "@/lib/format/inr";
import { deletePlan, listPlans } from "@/lib/storage/plans";
import type { PlanSnapshot } from "@/lib/types/plan";
import { Skeleton } from "@/components/ui/skeleton";

export function PlansClient() {
  const [plans, setPlans] = useState<PlanSnapshot[] | null>(null);

  const refresh = useCallback(() => {
    setPlans(listPlans());
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => setPlans(listPlans()), 0);
    return () => window.clearTimeout(id);
  }, []);

  const onDelete = (id: string) => {
    deletePlan(id);
    refresh();
    toast.success("Plan removed.");
  };

  if (plans === null) {
    return (
      <div className="mx-auto max-w-3xl space-y-4 px-4 py-12">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <FolderOpen className="mx-auto size-12 text-muted-foreground" />
        <h1 className="mt-6 text-2xl font-semibold tracking-tight">
          No saved plans yet
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Plans are stored in this browser only (demo). Save from the planner to
          see them here.
        </p>
        <Link
          href="/"
          className={cn(buttonVariants(), "mt-8 min-w-[200px] justify-center")}
        >
          Open planner
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Saved plans
        </h1>
        <p className="mt-2 text-muted-foreground text-sm">
          Stored locally in your browser. Clearing site data removes them.
        </p>
      </div>
      <ul className="space-y-4">
        {plans.map((p) => (
          <li key={p.id}>
            <Card>
              <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-base">
                    {p.inputs.goalDescription || "Untitled goal"}
                  </CardTitle>
                  <CardDescription>
                    Saved {new Date(p.createdAt).toLocaleString()} · Horizon{" "}
                    {p.inputs.horizonYears}y · Target (today){" "}
                    {formatInr(p.inputs.goalAmountTodayInr)}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/?id=${p.id}`}
                    className={cn(
                      buttonVariants({ size: "sm", variant: "secondary" })
                    )}
                  >
                    Open
                  </Link>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDelete(p.id)}
                    aria-label="Delete plan"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="text-muted-foreground text-sm">
                Projected corpus: {formatInr(p.summary.projectedCorpusInr)} ·
                Shortfall/surplus: {formatInr(p.summary.surplusOrShortfallInr)}
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
