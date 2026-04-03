"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  Save,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";

import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { CorpusChart } from "@/components/planner/corpus-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FormattedNumberInput } from "@/components/ui/formatted-number-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

import {
  computePlanSummary,
  getScenarioAssumptions,
  listScenarios,
  projectCorpusSeries,
} from "@/lib/calculations";
import type { GoalInputs, ScenarioKey } from "@/lib/types/plan";
import { formatInr, formatInrCompact, formatPercent } from "@/lib/format/inr";
import {
  defaultGoalFormValues,
  goalFormSchema,
  type GoalFormValues,
} from "@/lib/validation/goal-form";
import {
  buildSnapshotFromPlanner,
  getPlan,
  savePlan,
} from "@/lib/storage/plans";
import { explainPlanInBrowser } from "@/lib/ai/explain-client";
import { apiUrl } from "@/lib/api-url";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

const SCENARIO_COPY: Record<
  ScenarioKey,
  {
    eyebrow: string;
    reason: string;
  }
> = {
  conservative: {
    eyebrow: "Higher certainty",
    reason: "Uses the lowest expected return, so the SIP is usually highest.",
  },
  balanced: {
    eyebrow: "Most practical",
    reason: "A middle-ground estimate for investors who want a realistic plan.",
  },
  aggressive: {
    eyebrow: "Lower SIP target",
    reason: "Uses the highest expected return, so the SIP is usually lowest.",
  },
};

function formValuesToGoalBase(v: GoalFormValues): Omit<GoalInputs, "scenario"> {
  return {
    goalDescription: v.goalDescription,
    goalAmountTodayInr: v.goalAmountTodayInr,
    horizonYears: v.horizonYears,
    currentLumpSumInr: v.currentLumpSumInr,
    monthlySipInr: 0,
  };
}

function roundSip(amount: number): number {
  return Math.max(0, Math.ceil(amount / 500) * 500);
}

export function PlannerClient() {
  const searchParams = useSearchParams();
  const planId = searchParams.get("id");
  const initialPlan = planId ? getPlan(planId) ?? null : null;
  const initialFormValues = initialPlan
    ? {
        goalDescription: initialPlan.inputs.goalDescription,
        goalAmountTodayInr: initialPlan.inputs.goalAmountTodayInr,
        horizonYears: initialPlan.inputs.horizonYears,
        currentLumpSumInr: initialPlan.inputs.currentLumpSumInr,
        monthlySipInr: initialPlan.inputs.monthlySipInr,
        scenario: initialPlan.inputs.scenario,
      }
    : defaultGoalFormValues;

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema) as Resolver<GoalFormValues>,
    defaultValues: initialFormValues,
  });

  const [goalBase, setGoalBase] = useState<Omit<GoalInputs, "scenario"> | null>(
    initialPlan
      ? {
          goalDescription: initialPlan.inputs.goalDescription,
          goalAmountTodayInr: initialPlan.inputs.goalAmountTodayInr,
          horizonYears: initialPlan.inputs.horizonYears,
          currentLumpSumInr: initialPlan.inputs.currentLumpSumInr,
          monthlySipInr: 0,
        }
      : null
  );
  const [locked, setLocked] = useState<GoalInputs | null>(
    initialPlan ? initialPlan.inputs : null
  );
  const [whatIf, setWhatIf] = useState({
    sip: initialPlan
      ? initialPlan.inputs.monthlySipInr
      : defaultGoalFormValues.monthlySipInr,
    horizon: initialPlan
      ? initialPlan.inputs.horizonYears
      : defaultGoalFormValues.horizonYears,
  });
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiBullets, setAiBullets] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  useEffect(() => {
    if (!planId) return;
    if (!initialPlan) {
      toast.error("Saved plan not found.");
      return;
    }
    toast.success("Loaded saved plan.");
  }, [initialPlan, planId]);

  const effectiveInputs = useMemo(() => {
    if (!locked) return null;
    return {
      ...locked,
      monthlySipInr: whatIf.sip,
      horizonYears: whatIf.horizon,
    };
  }, [locked, whatIf.horizon, whatIf.sip]);

  const summary = useMemo(() => {
    if (!effectiveInputs) return null;
    return computePlanSummary(effectiveInputs);
  }, [effectiveInputs]);

  const chartSeries = useMemo(() => {
    if (!effectiveInputs) return [];
    const totalMonths = Math.round(effectiveInputs.horizonYears * 12);
    return projectCorpusSeries({
      lumpSumInr: effectiveInputs.currentLumpSumInr,
      monthlySipInr: effectiveInputs.monthlySipInr,
      annualNominalReturn:
        getScenarioAssumptions(effectiveInputs.scenario).annualNominalReturn,
      totalMonths,
      stepMonths: Math.max(1, Math.floor(totalMonths / 120)),
    });
  }, [effectiveInputs]);

  const suggestions = useMemo(() => {
    if (!goalBase) return null;
    return listScenarios().map((assumptions) => {
      const previewInputs: GoalInputs = { ...goalBase, scenario: assumptions.key };
      const preview = computePlanSummary(previewInputs);
      const suggestedSip = roundSip(preview.requiredMonthlySipInr);

      return {
        scenario: assumptions.key,
        assumptions,
        preview,
        suggestedSip,
      };
    });
  }, [goalBase]);

  const horizonBounds = useMemo(() => {
    const anchor =
      goalBase?.horizonYears ??
      locked?.horizonYears ??
      defaultGoalFormValues.horizonYears;

    return {
      min: Math.max(1, Math.floor(anchor - 5)),
      max: Math.min(40, Math.ceil(anchor + 10)),
    };
  }, [goalBase, locked]);

  const sipSliderMax = useMemo(() => {
    if (!summary) return 100_000;
    const anchor = Math.max(summary.requiredMonthlySipInr, whatIf.sip, 5_000);
    return roundSip(anchor * 1.75 + 5_000);
  }, [summary, whatIf.sip]);

  const onShowSuggestions = form.handleSubmit((values) => {
    setGoalBase(formValuesToGoalBase(values));
    setLocked(null);
    toast.success("Choose a suggestion to start.");
  });

  const onPickSuggestion = useCallback(
    (scenario: ScenarioKey, sip: number) => {
      if (!goalBase) return;

      const inputs: GoalInputs = {
        ...goalBase,
        scenario,
        monthlySipInr: sip,
      };

      setLocked(inputs);
      setWhatIf({
        sip,
        horizon: inputs.horizonYears,
      });
      setAiSummary(null);
      setAiBullets([]);
      setAiError(null);
      form.setValue("scenario", scenario);
      form.setValue("monthlySipInr", sip);
      toast.success(`${getScenarioAssumptions(scenario).label} suggestion selected.`);
    },
    [form, goalBase]
  );

  const onSavePlan = useCallback(() => {
    if (!locked || !summary) {
      toast.error("Select a suggestion first.");
      return;
    }

    try {
      savePlan(
        buildSnapshotFromPlanner({
          inputs: {
            ...locked,
            monthlySipInr: whatIf.sip,
            horizonYears: whatIf.horizon,
          },
          summary,
          explanation:
            aiSummary != null
              ? [aiSummary, ...aiBullets.map((bullet) => `• ${bullet}`)].join("\n\n")
              : undefined,
        })
      );
      toast.success("Plan saved.", {
        description: (
          <Link href="/plans" className="underline">
            View saved plans
          </Link>
        ),
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save.");
    }
  }, [aiBullets, aiSummary, locked, summary, whatIf.horizon, whatIf.sip]);

  const onBackToSuggestions = useCallback(() => {
    setLocked(null);
    setAiSummary(null);
    setAiBullets([]);
    setAiError(null);
  }, []);

  const onStartOver = useCallback(() => {
    setGoalBase(null);
    setLocked(null);
    setWhatIf({
      sip: defaultGoalFormValues.monthlySipInr,
      horizon: defaultGoalFormValues.horizonYears,
    });
    setAiSummary(null);
    setAiBullets([]);
    setAiError(null);
    form.reset(defaultGoalFormValues);
  }, [form]);

  const fetchAiExplanation = useCallback(async () => {
    if (!locked || !summary) return;

    setAiLoading(true);
    setAiError(null);

    try {
      if (process.env.NEXT_PUBLIC_GEMINI_API_KEY?.trim()) {
        const data = await explainPlanInBrowser({
          goalDescription: locked.goalDescription,
          scenarioLabel: getScenarioAssumptions(locked.scenario).label,
          summary,
        });
        setAiSummary(data.summary);
        setAiBullets(data.bullets ?? []);
        return;
      }

      const response = await fetch(apiUrl("/api/ai/explain"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          goalDescription: locked.goalDescription,
          scenarioLabel: getScenarioAssumptions(locked.scenario).label,
          summary,
        }),
      });

      const raw = await response.text();
      let json: {
        ok: boolean;
        error?: string;
        data?: {
          summary?: string;
          bullets?: string[];
        };
      };
      try {
        json = JSON.parse(raw) as typeof json;
      } catch {
        const looksLikeHtml = raw.trimStart().startsWith("<");
        throw new Error(
          looksLikeHtml
            ? "AI guidance on static hosting needs NEXT_PUBLIC_GEMINI_API_KEY at build time (see README), or run the app with next dev and GEMINI_API_KEY for API routes."
            : "Could not parse AI guidance response."
        );
      }

      if (!response.ok || !json.ok || !json.data?.summary) {
        throw new Error(json.error ?? "Could not generate AI guidance.");
      }

      setAiSummary(json.data.summary);
      setAiBullets(json.data.bullets ?? []);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Could not generate AI guidance.";
      setAiError(message);
      toast.error(message);
    } finally {
      setAiLoading(false);
    }
  }, [locked, summary]);

  const statusTone =
    summary && summary.surplusOrShortfallInr >= 0
      ? "text-emerald-700"
      : "text-amber-700";

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.92),rgba(242,248,246,0.98))] p-6 shadow-sm sm:p-8">
        <div className="absolute inset-y-0 right-0 hidden w-1/3 bg-[radial-gradient(circle_at_top,rgba(24,110,99,0.14),transparent_62%)] lg:block" />
        <div className="relative space-y-4">
          <div className="space-y-4  max-w-3xl relative">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge variant="outline" className="border-primary/20 bg-white/70">
              Simple goal to SIP planner
            </Badge>
          </div>
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-5xl">
            Enter the goal. Pick a suggestion. Adjust if needed.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">
            Start with just four inputs: what the goal is, what it costs today,
            when you need it, and how much you already have. The app then
            suggests SIP plans and lets you tweak one without clutter.
          </p>
          </div>
          <div className="flex justify-between">
            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-foreground/8">
                1. Goal
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-foreground/8">
                2. Suggestions
              </span>
              <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-foreground/8">
                3. Tweak and save
              </span>
            </div>
            <Badge variant="outline" className="border-primary bg-primary/5 py-3 px-3">
            <span className="text-sm font-semibold leading-snug text-foreground">
            A project by Vishal P, IIT Delhi
            </span>
            </Badge>
          </div>
         
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <Card className="border-border/70 bg-card/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Target className="size-5 text-primary" />
              Step 1: Tell us the goal
            </CardTitle>
            <CardDescription>
              Keep it simple. These are the only inputs needed to generate SIP
              suggestions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                void onShowSuggestions();
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="goalDescription">Goal</Label>
                <Input
                  id="goalDescription"
                  {...form.register("goalDescription")}
                  placeholder="Example: Car Fund"
                />
                {form.formState.errors.goalDescription ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.goalDescription.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="goalAmountTodayInr">
                    Target (today&apos;s cost, ₹)
                  </Label>
                  <FormattedNumberInput
                    control={form.control}
                    name="goalAmountTodayInr"
                    id="goalAmountTodayInr"
                    mode="integer"
                    placeholder="25,00,000"
                  />
                  {form.formState.errors.goalAmountTodayInr ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.goalAmountTodayInr.message}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="horizonYears">Years until you need it</Label>
                  <FormattedNumberInput
                    control={form.control}
                    name="horizonYears"
                    id="horizonYears"
                    mode="decimal"
                    maxDecimals={2}
                    placeholder="8"
                  />
                  {form.formState.errors.horizonYears ? (
                    <p className="text-sm text-destructive">
                      {form.formState.errors.horizonYears.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currentLumpSumInr">Already saved (₹)</Label>
                <FormattedNumberInput
                  control={form.control}
                  name="currentLumpSumInr"
                  id="currentLumpSumInr"
                  mode="integer"
                  placeholder="0"
                />
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                Show SIP suggestions
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <DisclaimerBanner />

          <Card className="border-border/70 bg-[linear-gradient(180deg,rgba(248,250,249,0.95),rgba(255,255,255,0.98))] shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">How the suggestions work</CardTitle>
              <CardDescription>
                Each suggestion uses the same goal and inflation assumption. The
                return profile changes the SIP needed to reach the target.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <div className="flex items-start gap-3 rounded-2xl bg-white/85 p-3 ring-1 ring-foreground/6">
                <span className="mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Cautious
                </span>
                <p>Higher SIP, lower expected return.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-white/85 p-3 ring-1 ring-foreground/6">
                <span className="mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Balanced
                </span>
                <p>Usually the easiest plan to work with in practice.</p>
              </div>
              <div className="flex items-start gap-3 rounded-2xl bg-white/85 p-3 ring-1 ring-foreground/6">
                <span className="mt-0.5 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Growth
                </span>
                <p>Lower SIP, but relies on stronger return assumptions.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {suggestions ? (
        <div className="mt-8 space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">
                Step 2: Choose a suggestion
              </h2>
              <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
                Start with the one that feels believable for you.
                {locked ? (
                  <>
                    {" "}
                    Your tweak workspace is below—switch suggestions here anytime.
                  </>
                ) : (
                  <>
                    {" "}
                    You can tweak the SIP and timeline immediately after selecting
                    it.
                  </>
                )}
              </p>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onStartOver}>
              Start over
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {suggestions.map(({ scenario, assumptions, preview, suggestedSip }) => (
              <Card
                key={scenario}
                className={cn(
                  "border-border/80 bg-card/95 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md",
                  locked?.scenario === scenario &&
                    "ring-2 ring-primary/80 ring-offset-2 ring-offset-background"
                )}
              >
                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <Badge variant="outline">{SCENARIO_COPY[scenario].eyebrow}</Badge>
                    <Badge>{formatPercent(assumptions.annualNominalReturn)}</Badge>
                  </div>
                  <CardTitle>{assumptions.label}</CardTitle>
                  <CardDescription>{SCENARIO_COPY[scenario].reason}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="rounded-2xl bg-muted/50 p-4">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                      Suggested SIP
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                      {formatInr(suggestedSip)}
                      <span className="ml-1 text-sm font-medium text-muted-foreground">
                        / month
                      </span>
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-muted-foreground">Future target</p>
                      <p className="mt-1 font-medium">
                        {formatInrCompact(preview.futureNominalTargetInr)}
                      </p>
                    </div>
                    <div className="rounded-xl border border-border/70 p-3">
                      <p className="text-muted-foreground">Inflation used</p>
                      <p className="mt-1 font-medium">
                        {formatPercent(preview.annualInflation)}
                      </p>
                    </div>
                  </div>

                  {locked?.scenario === scenario ? (
                    <Button
                      type="button"
                      variant="secondary"
                      className="w-full"
                      disabled
                    >
                      <Check className="size-4" />
                      Selected
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="w-full"
                      onClick={() => onPickSuggestion(scenario, suggestedSip)}
                    >
                      Pick this suggestion
                      <ChevronRight className="size-4" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {locked && summary ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={onBackToSuggestions}
                    >
                      <ArrowLeft className="size-4" />
                      Back
                    </Button>
                    <Badge variant="outline">
                      {getScenarioAssumptions(locked.scenario).label}
                    </Badge>
                  </div>
                  <CardTitle className="mt-3 text-xl">Step 3: Tweak your plan</CardTitle>
                  <CardDescription className="mt-1">
                    {locked.goalDescription} for{" "}
                    {formatInr(goalBase?.goalAmountTodayInr ?? locked.goalAmountTodayInr)} in
                    today&apos;s money.
                  </CardDescription>
                </div>

                <Button type="button" variant="outline" onClick={onSavePlan}>
                  <Save className="size-4" />
                  Save plan
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-[linear-gradient(180deg,rgba(24,110,99,0.08),rgba(24,110,99,0.02))] p-4 ring-1 ring-primary/10">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Monthly SIP
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    {formatInr(whatIf.sip)}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/45 p-4 ring-1 ring-foreground/6">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Future target
                  </p>
                  <p className="mt-2 text-3xl font-semibold tracking-tight">
                    {formatInrCompact(summary.futureNominalTargetInr)}
                  </p>
                </div>
                <div className="rounded-2xl bg-muted/45 p-4 ring-1 ring-foreground/6">
                  <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
                    Status
                  </p>
                  <p className={`mt-2 text-3xl font-semibold tracking-tight ${statusTone}`}>
                    {summary.surplusOrShortfallInr >= 0 ? "On track" : "Needs more"}
                  </p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label>Monthly SIP</Label>
                    <span className="text-sm font-medium">{formatInr(whatIf.sip)}</span>
                  </div>
                  <Slider
                    min={0}
                    max={sipSliderMax}
                    step={500}
                    value={[whatIf.sip]}
                    onValueChange={([value]) => {
                      setAiSummary(null);
                      setAiBullets([]);
                      setAiError(null);
                      setWhatIf((current) => ({
                        ...current,
                        sip: value ?? current.sip,
                      }));
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-4">
                    <Label>Years to goal</Label>
                    <span className="text-sm font-medium">
                      {whatIf.horizon.toFixed(1)} years
                    </span>
                  </div>
                  <Slider
                    min={horizonBounds.min}
                    max={horizonBounds.max}
                    step={0.5}
                    value={[whatIf.horizon]}
                    onValueChange={([value]) => {
                      setAiSummary(null);
                      setAiBullets([]);
                      setAiError(null);
                      setWhatIf((current) => ({
                        ...current,
                        horizon: value ?? current.horizon,
                      }));
                    }}
                  />
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Projected corpus with these settings
                  </p>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">
                    {formatInr(summary.projectedCorpusInr)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Difference vs target</p>
                  <p className={`mt-1 text-2xl font-semibold tracking-tight ${statusTone}`}>
                    {summary.surplusOrShortfallInr >= 0 ? "+" : "-"}
                    {formatInr(Math.abs(summary.surplusOrShortfallInr))}
                  </p>
                </div>
              </div>

              <CorpusChart
                data={chartSeries}
                targetInr={summary.futureNominalTargetInr}
              />
            </CardContent>
          </Card>

          <Card className="border-border/70 bg-card/95 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <SlidersHorizontal className="size-5 text-primary" />
                Plan details
              </CardTitle>
              <CardDescription>
                The compact summary of what this plan is assuming.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Goal in today&apos;s rupees</span>
                  <span className="font-medium">{formatInr(summary.goalInTodaysRupeesInr)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Already saved</span>
                  <span className="font-medium">{formatInr(locked.currentLumpSumInr)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Inflation used</span>
                  <span className="font-medium">{formatPercent(summary.annualInflation)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Expected annual return</span>
                  <span className="font-medium">{formatPercent(summary.annualNominalReturn)}</span>
                </div>
                <div className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-muted-foreground">Suggested SIP for this path</span>
                  <span className="font-medium">{formatInr(summary.requiredMonthlySipInr)}</span>
                </div>
              </div>

              <Separator />

              <div className="rounded-2xl bg-muted/45 p-4 text-sm text-muted-foreground">
                <p className="font-medium text-foreground">How to read this</p>
                <p className="mt-2 leading-6">
                  If the plan says <span className="font-medium text-foreground">On track</span>,
                  your current SIP and timeline should be enough under this
                  return assumption. If it says{" "}
                  <span className="font-medium text-foreground">Needs more</span>,
                  increase SIP, extend time, or choose a different suggestion.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-foreground">
                      AI guidance
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Explains the current plan, then suggests practical ways to
                      improve your chances of reaching the goal.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => void fetchAiExplanation()}
                    disabled={aiLoading}
                  >
                    {aiLoading ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <Sparkles className="size-4" />
                    )}
                    Get guidance
                  </Button>
                </div>

                {aiError ? (
                  <Alert variant="destructive">
                    <AlertTitle>AI guidance unavailable</AlertTitle>
                    <AlertDescription>{aiError}</AlertDescription>
                  </Alert>
                ) : null}

                {aiLoading ? (
                  <div className="space-y-2 rounded-2xl border border-border/70 p-4">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[92%]" />
                    <Skeleton className="h-4 w-[85%]" />
                  </div>
                ) : null}

                {aiSummary ? (
                  <div className="rounded-2xl border border-border/70 bg-muted/35 p-4">
                    <p className="text-sm leading-6 text-foreground">{aiSummary}</p>
                    {aiBullets.length > 0 ? (
                      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                        {aiBullets.map((bullet) => (
                          <li key={bullet} className="leading-6">
                            • {bullet}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ) : null}
              </div>

              <Link
                href="/plans"
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "inline-flex w-full"
                )}
              >
                View saved plans
              </Link>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
