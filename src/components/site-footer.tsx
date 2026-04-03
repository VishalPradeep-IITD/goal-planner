export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/70 py-8 text-center text-xs text-muted-foreground">
      <p className="mx-auto max-w-2xl px-4">
        Illustrative planning tool only. Returns and inflation are simplified
        assumptions, not predictions or personal advice.
      </p>
      <p className="mt-2">© {new Date().getFullYear()} Goal Planner</p>
    </footer>
  );
}
