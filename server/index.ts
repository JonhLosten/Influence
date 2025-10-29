import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { URL } from "url";
import { createAnalyticsPipeline } from "./pipeline";
import { getProfileAnalytics, getPostsAnalytics } from "./ayrshare";
import type { Network } from "./types";
import { fetchSuggestions } from "./suggest";

const PORT = Number(process.env.PORT || 5174);

const pipeline = createAnalyticsPipeline({
  fetchProfile: getProfileAnalytics,
  fetchPosts: getPostsAnalytics,
});

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
      const snapshot = await pipeline.fetchSnapshot(network as Network, days);
      sendJSON(res, 200, snapshot, origin);
      return;
    }

    if (url.pathname === "/api/overview") {
      const days = pipeline.clampDays(url.searchParams.get("days"), 30);
      const overview = await pipeline.fetchOverview(days);
      sendJSON(res, 200, overview, origin);
      return;
    }

    if (url.pathname === "/api/suggest") {
      const networkParam = url.searchParams.get("network") || "";
      if (!pipeline.ensureNetwork(networkParam)) {
        sendJSON(res, 400, { error: "Unknown network" }, origin);
        return;
      }
      const query = url.searchParams.get("q") || "";
      const items = await fetchSuggestions(networkParam as Network, query);
      sendJSON(res, 200, { items }, origin);
      return;
    }

    sendJSON(res, 404, { error: "Not found" }, origin);
  } catch (error) {
    console.error("Failed to handle analytics request", error);
    sendJSON(res, 500, { error: "Failed to compute analytics" }, origin);
  }
});

server.listen(PORT, () => {
  console.log(`✅ Analytics pipeline active on http://localhost:${PORT}`);
});
