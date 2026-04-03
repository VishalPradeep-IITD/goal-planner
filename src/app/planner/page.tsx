"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/** Old path; forwards to `/` so bookmarks and links keep working. */
function LegacyPlannerRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      router.replace(`/?id=${encodeURIComponent(id)}`);
    } else {
      router.replace("/");
    }
  }, [router, searchParams]);

  return null;
}

export default function LegacyPlannerRedirect() {
  return (
    <Suspense fallback={null}>
      <LegacyPlannerRedirectInner />
    </Suspense>
  );
}
