import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
  type Server,
} from "http";
import { URL, pathToFileURL } from "url";
import { createAnalyticsPipeline } from "./pipeline";
import { getProfileAnalytics, getPostsAnalytics } from "./ayrshare";
import type { Network } from "./types";
import { fetchAccountSuggestions } from "./suggest";

const PORT = Number(process.env.PORT || 5174);

const pipeline = createAnalyticsPipeline({
  fetchProfile: getProfileAnalytics,
  fetchPosts: getPostsAnalytics,
});

function sanitizeAccountHandle(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "";
  const withoutPrefix = trimmed.startsWith("@")
    ? trimmed.slice(1)
    : trimmed;
  const clean = withoutPrefix.replace(/[^a-z0-9_.-]/gi, "");
  return clean ? `@${clean}` : "";
}

function parseAccountsForNetwork(
  params: URLSearchParams,
  network: Network
) {
  const raw = params.getAll("account");
  const handles: string[] = [];
  raw.forEach((entry) => {
    entry
      .split(",")
      .map((value) => value.trim())
      .forEach((token) => {
        if (!token) return;
        if (token.includes(":")) {
          const [prefix, rest] = token.split(/:(.+)/);
          if (pipeline.ensureNetwork(prefix) && prefix === network) {
            const normalized = sanitizeAccountHandle(rest ?? "");
            if (normalized) handles.push(normalized);
          }
          return;
        }
        const normalized = sanitizeAccountHandle(token);
        if (normalized) handles.push(normalized);
      });
  });
  return handles;
}

function parseAccountsByNetwork(params: URLSearchParams) {
  const raw = params.getAll("account");
  const result: Partial<Record<Network, string[]>> = {};
  raw.forEach((entry) => {
    entry
      .split(",")
      .map((value) => value.trim())
      .forEach((token) => {
        if (!token) return;
        if (!token.includes(":")) return;
        const [prefix, rest] = token.split(/:(.+)/);
        if (!prefix || !rest) return;
        if (!pipeline.ensureNetwork(prefix)) return;
        const normalized = sanitizeAccountHandle(rest);
        if (!normalized) return;
        const key = prefix as Network;
        result[key] = [...(result[key] ?? []), normalized];
      });
  });
  return result;
}

function sendJSON(
  res: ServerResponse,
  status: number,
  body: unknown,
  origin: string | undefined
) {
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (!req.url) {
    sendJSON(res, 404, { error: "Not found" }, req.headers.origin);
    return;
  }

  const origin = req.headers.origin || "*";
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  if (req.method !== "GET") {
    sendJSON(res, 405, { error: "Method not allowed" }, origin);
    return;
  }

  try {
    if (url.pathname.startsWith("/api/networks/")) {
      const network = url.pathname.split("/").pop() as string;
      if (!pipeline.ensureNetwork(network)) {
        sendJSON(res, 400, { error: "Unknown network" }, origin);
        return;
      }
      const days = pipeline.clampDays(url.searchParams.get("days"), 30);
      const accounts = parseAccountsForNetwork(
        url.searchParams,
        network as Network
      );
      const snapshot = await pipeline.fetchSnapshot(
        network as Network,
        days,
        accounts
      );
      sendJSON(res, 200, snapshot, origin);
      return;
    }

    if (url.pathname === "/api/overview") {
      const days = pipeline.clampDays(url.searchParams.get("days"), 30);
      const accountsByNetwork = parseAccountsByNetwork(url.searchParams);
      const overview = await pipeline.fetchOverview(days, accountsByNetwork);
      sendJSON(res, 200, overview, origin);
      return;
    }

    if (url.pathname === "/api/suggest") {
      const network = url.searchParams.get("network") ?? "";
      const query = url.searchParams.get("q") ?? "";
      if (!pipeline.ensureNetwork(network)) {
        sendJSON(res, 400, { error: "Unknown network" }, origin);
        return;
      }
      const suggestions = await fetchAccountSuggestions(network as Network, query);
      sendJSON(res, 200, { suggestions }, origin);
      return;
    }

    sendJSON(res, 404, { error: "Not found" }, origin);
  } catch (error) {
    console.error("Failed to handle analytics request", error);
    sendJSON(res, 500, { error: "Failed to compute analytics" }, origin);
  }
});

export function startAnalyticsServer(port = PORT): Server {
  const activePort = Number(port) || PORT;
  server.listen(activePort, () => {
    console.log(`✅ Analytics pipeline active on http://localhost:${activePort}`);
  });
  return server;
}

const isMainModule = (() => {
  const entry = process.argv?.[1];
  if (!entry) return false;
  try {
    return pathToFileURL(entry).href === import.meta.url;
  } catch {
    return false;
  }
})();

if (isMainModule) {
  startAnalyticsServer();
}
