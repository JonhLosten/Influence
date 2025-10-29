const env = (import.meta as any).env ?? {};

export const API_BASE: string =
  env.VITE_API_URL || (typeof window !== "undefined" ? window.location.origin : "http://localhost:5174");

export function resolveApiUrl(path: string): string {
  const base = API_BASE.replace(/\/$/, "");
  return `${base}${path}`;
}
