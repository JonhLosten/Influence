const envBase = (import.meta as any).env?.VITE_API_URL;

const DEFAULT_PORT = 5174;

function computeDefaultBase(): string {
  if (typeof window === "undefined") {
    return `http://localhost:${DEFAULT_PORT}`;
  }
  const { protocol, hostname, port } = window.location;
  if (protocol === "file:") {
    return `http://localhost:${DEFAULT_PORT}`;
  }
  const parsed = Number(port);
  if (Number.isFinite(parsed)) {
    if (parsed === DEFAULT_PORT) {
      return `${protocol}//${hostname}:${parsed}`;
    }
    if (parsed === DEFAULT_PORT - 1) {
      return `${protocol}//${hostname}:${DEFAULT_PORT}`;
    }
  }
  return `${protocol}//${hostname}:${DEFAULT_PORT}`;
}

export const API_BASE: string =
  typeof envBase === "string" && envBase.trim().length > 0
    ? envBase
    : computeDefaultBase();

export function resolveApiUrl(path: string) {
  const base = API_BASE.replace(/\/$/, "");
  if (!path.startsWith("/")) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}
