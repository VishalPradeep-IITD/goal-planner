/**
 * API base for client-side `fetch` calls. Default is same-origin (works with `next start` / Vercel).
 * Set `NEXT_PUBLIC_API_BASE_URL` when the UI is on static hosting but the API is deployed elsewhere.
 */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL?.trim().replace(/\/$/, "") ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return base ? `${base}${p}` : p;
}
