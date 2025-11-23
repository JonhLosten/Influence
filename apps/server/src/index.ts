import * as Sentry from "@sentry/node";
import { httpIntegration } from "@sentry/node/integrations";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import { createServer, type IncomingMessage, type ServerResponse } from "http";
import { URL } from "url";
import { z } from "zod";
import { NetworkIdSchema } from "@influence/sdk";
import { database, databasePath } from "@influence/db";
import { createAnalyticsPipeline } from "./pipeline";
import { getProfileAnalytics, getPostsAnalytics } from "./ayrshare";
import type { Network } from "./types";
import { SocialNetwork } from "./types";
import { fetchAccountSuggestions } from "./suggest";
import {
  ChannelSearch,
  YouTubeSearchError,
  YouTubeSearchErrorCodes,
} from "./youtube";
import { JobOrchestrator } from "./jobOrchestrator";
import { FfmpegService } from "./ffmpeg";
import { AyrshareService } from "./ayrshareService";
import { VideoPublishPayloadSchema, JobStatus } from "./publisher";
import { AppError, AppErrorCodes } from "./errors";
import { SocialMediaPublisher } from "./socialMediaInterfaces";

if (process.env.SENTRY_DSN_SERVER) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN_SERVER,
    integrations: [httpIntegration(), nodeProfilingIntegration()],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
    sendDefaultPii: true,
  });
}

const PORT = Number(process.env.PORT || 5174);

const pipeline = createAnalyticsPipeline({
  fetchProfile: getProfileAnalytics,
  fetchPosts: getPostsAnalytics,
});

const channelSearch = new ChannelSearch(
  process.env.YOUTUBE_API_KEY || "MOCK_API_KEY"
);

const ffmpegService = new FfmpegService();
const ayrshareService = new AyrshareService(
  process.env.AYRSHARE_API_KEY || "MOCK_API_KEY"
);

const retryIntervals = [5 * 1000, 30 * 1000, 2 * 60 * 1000, 10 * 60 * 1000];

const publishers: Record<SocialNetwork, SocialMediaPublisher> = {
  [SocialNetwork.YOUTUBE]: ayrshareService,
  [SocialNetwork.INSTAGRAM]: ayrshareService,
  [SocialNetwork.TIKTOK]: ayrshareService,
  [SocialNetwork.FACEBOOK]: ayrshareService,
  [SocialNetwork.X]: ayrshareService,
};

const jobOrchestrator = new JobOrchestrator({
  ffmpegService,
  publishers,
  retryIntervals,
});

console.warn(`🗄️ SQLite database initialisée: ${databasePath}`);
void database;

const DaysSchema = z.coerce.number().min(1).max(90).default(30);

async function getJSONBody<T>(req: IncomingMessage): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        if (body) {
          resolve(JSON.parse(body));
        } else {
          resolve(undefined);
        }
      } catch (error) {
        reject(
          new AppError(
            "Invalid JSON body",
            AppErrorCodes.GENERAL_INVALID_PARAMS,
            { originalError: (error as Error).message }
          )
        );
      }
    });
    req.on("error", (err) => {
      reject(
        new AppError(
          `Request read error: ${err.message}`,
          AppErrorCodes.GENERAL_UNKNOWN_ERROR
        )
      );
    });
  });
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
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(body));
}

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    if (!req.url) {
      sendJSON(res, 404, { error: "Not found" }, req.headers.origin);
      return;
    }

    const origin = req.headers.origin || "*";
    const url = new URL(req.url, `http://localhost:${PORT}`);

    if (req.method === "GET" && url.pathname === "/debug-sentry") {
      throw new Error("My first Sentry error!");
    }

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": origin,
        "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      });
      res.end();
      return;
    }

    try {
      if (url.pathname.startsWith("/api/networks/")) {
        if (req.method !== "GET") {
          sendJSON(res, 405, { error: "Method not allowed" }, origin);
          return;
        }
        const networkResult = NetworkIdSchema.safeParse(
          url.pathname.split("/").pop()
        );
        if (!networkResult.success) {
          sendJSON(res, 400, { error: "Unknown network" }, origin);
          return;
        }
        const days = DaysSchema.parse(url.searchParams.get("days"));
        const snapshot = await pipeline.fetchSnapshot(
          networkResult.data as Network,
          days
        );
        sendJSON(res, 200, snapshot, origin);
        return;
      }

      if (url.pathname === "/api/overview") {
        if (req.method !== "GET") {
          sendJSON(res, 405, { error: "Method not allowed" }, origin);
          return;
        }
        const days = DaysSchema.parse(url.searchParams.get("days"));
        const overview = await pipeline.fetchOverview(days);
        sendJSON(res, 200, overview, origin);
        return;
      }

      if (url.pathname === "/api/suggest") {
        if (req.method !== "GET") {
          sendJSON(res, 405, { error: "Method not allowed" }, origin);
          return;
        }
        const payloadSchema = z.object({
          network: NetworkIdSchema,
          q: z.string().min(1),
        });
        const payloadResult = payloadSchema.safeParse({
          network: url.searchParams.get("network"),
          q: url.searchParams.get("q"),
        });
        if (!payloadResult.success) {
          sendJSON(
            res,
            400,
            {
              error: "Invalid parameters",
              details: payloadResult.error.flatten(),
            },
            origin
          );
          return;
        }
        const suggestions = await fetchAccountSuggestions(
          payloadResult.data.network as Network,
          payloadResult.data.q
        );
        sendJSON(res, 200, { suggestions }, origin);
        return;
      }

      if (url.pathname === "/api/youtube/search") {
        if (req.method !== "GET") {
          sendJSON(res, 405, { error: "Method not allowed" }, origin);
          return;
        }
        const query = url.searchParams.get("q");
        if (!query) {
          sendJSON(
            res,
            400,
            { error: "Missing search query parameter (q)" },
            origin
          );
          return;
        }
        try {
          const results = await channelSearch.searchChannels(query);
          sendJSON(res, 200, { results }, origin);
          return;
        } catch (error) {
          if (error instanceof YouTubeSearchError) {
            let statusCode = 500;
            switch (error.code) {
              case YouTubeSearchErrorCodes.NO_RESULTS:
                statusCode = 404;
                break;
              case YouTubeSearchErrorCodes.API_KEY_MISSING:
                statusCode = 401;
                break;
              case YouTubeSearchErrorCodes.QUOTA_EXCEEDED:
                statusCode = 403;
                break;
              case YouTubeSearchErrorCodes.NETWORK_DOWN:
                statusCode = 503;
                break;
              default:
                statusCode = 500;
            }
            sendJSON(
              res,
              statusCode,
              { error: error.message, code: error.code },
              origin
            );
            return;
          }
          console.error("Failed to search YouTube channels", error);
          sendJSON(
            res,
            500,
            { error: "Failed to search YouTube channels" },
            origin
          );
          return;
        }
      }

      if (url.pathname === "/api/publish/video") {
        if (req.method !== "POST") {
          sendJSON(res, 405, { error: "Method not allowed" }, origin);
          return;
        }
        const body = await getJSONBody(req);
        const payloadResult = VideoPublishPayloadSchema.safeParse(body);

        if (!payloadResult.success) {
          sendJSON(
            res,
            400,
            {
              error: "Invalid video publish payload",
              details: payloadResult.error.flatten(),
            },
            origin
          );
          return;
        }

        try {
          const job = await jobOrchestrator.addJob(payloadResult.data);
          sendJSON(
            res,
            202,
            {
              message: "Video publishing job enqueued",
              jobId: job.id,
              status: job.status,
            },
            origin
          );
        } catch (error) {
          console.error("Failed to enqueue video publishing job", error);
          if (error instanceof AppError) {
            sendJSON(
              res,
              400,
              {
                error: error.message,
                code: error.code,
                details: error.details,
              },
              origin
            );
          } else {
            sendJSON(
              res,
              500,
              { error: "Failed to enqueue video publishing job" },
              origin
            );
          }
        }
        return;
      }

      if (url.pathname.startsWith("/api/publish/status/")) {
        if (req.method !== "GET") {
          sendJSON(res, 405, { error: "Method not allowed" }, origin);
          return;
        }
        const jobId = url.pathname.split("/").pop();
        if (!jobId) {
          sendJSON(res, 400, { error: "Missing job ID" }, origin);
          return;
        }

        try {
          const job = await jobOrchestrator.getJob(jobId);
          if (!job) {
            sendJSON(res, 404, { error: "Job not found" }, origin);
            return;
          }
          sendJSON(res, 200, { job }, origin);
        } catch (error) {
          console.error(`Failed to retrieve job ${jobId} status`, error);
          sendJSON(
            res,
            500,
            { error: "Failed to retrieve job status" },
            origin
          );
        }
        return;
      }

      if (url.pathname.startsWith("/api/publish/retry/")) {
        if (req.method !== "POST") {
          sendJSON(res, 405, { error: "Method not allowed" }, origin);
          return;
        }
        const jobId = url.pathname.split("/").pop();
        if (!jobId) {
          sendJSON(res, 400, { error: "Missing job ID" }, origin);
          return;
        }

        try {
          const job = await jobOrchestrator.getJob(jobId);
          if (!job) {
            sendJSON(res, 404, { error: "Job not found" }, origin);
            return;
          }
          await jobOrchestrator.updateJob(jobId, {
            status: JobStatus.QUEUED,
            retryCount: 0,
            error: null,
            scheduledFor: new Date().toISOString(),
          });
          sendJSON(
            res,
            200,
            {
              message: `Job ${jobId} re-queued successfully.`,
              jobId,
              status: JobStatus.QUEUED,
            },
            origin
          );
        } catch (error) {
          console.error(`Failed to re-queue job ${jobId}`, error);
          const typedError = error as Error;
          const appError =
            error instanceof AppError
              ? error
              : new AppError(
                  typedError.message || "An unknown error occurred.",
                  AppErrorCodes.GENERAL_UNKNOWN_ERROR,
                  { originalError: typedError.message }
                );
          const userMessage = appError.toUserMessage();
          sendJSON(
            res,
            500,
            {
              error: userMessage.message,
              code: appError.code,
              details: appError.details || {
                cause: userMessage.cause,
                resolution: userMessage.resolution,
              },
            },
            origin
          );
        }
        return;
      }

      if (url.pathname === "/api/logs/export") {
        if (req.method !== "GET") {
          sendJSON(res, 405, { error: "Method not allowed" }, origin);
          return;
        }
        const mockLogs = `[${new Date().toISOString()}] INFO: Application started.\n[${new Date().toISOString()}] DEBUG: User accessed /api/logs/export\n[${new Date().toISOString()}] WARNING: This is a mock log file. Real logs would be here.`;
        res.writeHead(200, {
          "Content-Type": "text/plain",
          "Content-Disposition": 'attachment; filename="influence_logs.txt"',
          "Access-Control-Allow-Origin": origin || "*",
          "Access-Control-Allow-Methods": "GET,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        });
        res.end(mockLogs);
        return;
      }

      sendJSON(res, 404, { error: "Not found" }, origin);
    } catch (error) {
      if (process.env.SENTRY_DSN_SERVER) {
        Sentry.captureException(error);
      }
      console.error("Failed to handle API request", error);
      const typedError = error as Error;
      const appError =
        error instanceof AppError
          ? error
          : new AppError(
              typedError.message || "An unknown error occurred.",
              AppErrorCodes.GENERAL_UNKNOWN_ERROR,
              { originalError: typedError.message }
            );
      const userMessage = appError.toUserMessage();
      sendJSON(
        res,
        500,
        {
          error: userMessage.message,
          code: appError.code,
          details: appError.details || {
            cause: userMessage.cause,
            resolution: userMessage.resolution,
          },
        },
        origin
      );
    }
  }
);

server.listen(PORT, () => {
  console.warn(`✅ Analytics pipeline active on http://localhost:${PORT}`);
});
