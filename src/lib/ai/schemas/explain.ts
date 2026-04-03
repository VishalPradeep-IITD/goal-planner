import { z } from "zod";

export const explainSchema = z.object({
  summary: z.string().min(10).max(8000),
  bullets: z.array(z.string()).max(12).optional(),
});

export type ExplainResult = z.infer<typeof explainSchema>;
