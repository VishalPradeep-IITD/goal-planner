import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type PlannerRedirectPageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

/** Old path; forwards to `/` so bookmarks and links keep working. */
export default async function LegacyPlannerRedirect({
  searchParams,
}: PlannerRedirectPageProps) {
  const params = await searchParams;
  const raw = params.id;
  const id = Array.isArray(raw) ? raw[0] : raw;
  if (id) {
    redirect(`/?id=${encodeURIComponent(id)}`);
  }
  redirect("/");
}
