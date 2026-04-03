# Goal Planner

A production-style **demo** web app: Next.js App Router, TypeScript, Tailwind, shadcn/ui, React Hook Form + Zod, Recharts, and **Google Gemini** for structured extraction and optional plain-English explanations. **No database**—saved plans use `localStorage` in the browser only.

## Disclaimer

This tool is **illustrative and educational**, not financial, tax, or legal advice. All returns, inflation rates, and projections are **assumptions**. Actual results will differ. Consult a qualified professional for personal decisions.

## Features

- Landing page, planner, and saved-plans views
- Natural-language goal input with **Gemini** JSON extraction validated by **Zod** (no invented amounts—missing fields surface in the form)
- **Three plan paths** (steadier / balanced / growth-focused) from the same goal numbers—different assumed returns, side-by-side cards; pick one to visualize
- Modular calculators: inflation-adjusted nominal target, SIP FV, lump-sum FV, required SIP, corpus series for charts
- Optional AI: plain-English explanation of the figures on screen (prompts forbid inventing numbers)
- What-if sliders (SIP, horizon, optional return override) on the chosen path
- INR formatting (`en-IN`)
- Mobile-responsive layout

## Setup

```bash
npm install
cp .env.example .env.local
# Add GEMINI_API_KEY from https://aistudio.google.com/apikey
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Without an API key

Form-based planning, path comparison, and charts work without a key. Extraction and explanation need `GEMINI_API_KEY`.

## Scripts

- `npm run dev` — development server
- `npm run build` — production build
- `npm run start` — run production build
- `npm run lint` — ESLint

## Project layout

- `src/app/` — routes (`/`, `/planner`, `/plans`) and `api/ai/*` route handlers
- `src/lib/calculations/` — pure financial utilities
- `src/lib/ai/` — Gemini client, Zod schemas, prompt templates
- `src/lib/storage/plans.ts` — localStorage persistence (client-only)
- `src/lib/demo/sample-inputs.ts` — sample texts for quick demos

## Assumptions (calculator)

- **Goal amount** is entered as **today’s cost** (purchasing power). **Nominal future need** = today’s cost × (1 + inflation)^years.
- **Portfolio growth** uses the scenario’s assumed **nominal annual return**, converted to a **monthly rate** as annual/12 (common SIP convention).
- **Monthly compounding** on both lump sum and SIP; payments at month-end.

Pick a path to set the assumed return; use the what-if slider to override return for sensitivity analysis.

## Sample demo inputs

See `src/lib/demo/sample-inputs.ts` or use the quick-fill chips on the planner page. Example:

> We need about ₹40 lakhs in today’s money for my daughter’s undergrad abroad in 12 years. We can put ₹5 lakhs lump sum now and invest ₹18,000 per month in mutual funds.

## Environment variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GEMINI_API_KEY` | For AI features | Google AI Studio API key |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.5-flash-lite` |
| `NEXT_PUBLIC_APP_URL` | No | Optional canonical URL |
