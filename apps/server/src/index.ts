import { createServer, type IncomingMessage, type ServerResponse } from 'http';
import { URL } from 'url';
import { z } from 'zod';
import { NetworkIdSchema } from '@influence/sdk';
import { database, databasePath } from '@influence/db';
import { createAnalyticsPipeline } from './pipeline';
import { getProfileAnalytics, getPostsAnalytics } from './ayrshare';
import type { Network } from './types';
import { fetchAccountSuggestions } from './suggest';

const PORT = Number(process.env.PORT || 5174);

const pipeline = createAnalyticsPipeline({
  fetchProfile: getProfileAnalytics,
  fetchPosts: getPostsAnalytics,
});

console.info(`🗄️ SQLite database initialisée: ${databasePath}`);
void database;

const DaysSchema = z.coerce.number().min(1).max(90).default(30);

function sendJSON(res: ServerResponse, status: number, body: unknown, origin: string | undefined) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(body));
}

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  if (!req.url) {
    sendJSON(res, 404, { error: 'Not found' }, req.headers.origin);
    return;
  }

  const origin = req.headers.origin || '*';
  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET,OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    sendJSON(res, 405, { error: 'Method not allowed' }, origin);
    return;
  }

  try {
    if (url.pathname.startsWith('/api/networks/')) {
      const networkResult = NetworkIdSchema.safeParse(url.pathname.split('/').pop());
      if (!networkResult.success) {
        sendJSON(res, 400, { error: 'Unknown network' }, origin);
        return;
      }
      const days = DaysSchema.parse(url.searchParams.get('days'));
      const snapshot = await pipeline.fetchSnapshot(networkResult.data as Network, days);
      sendJSON(res, 200, snapshot, origin);
      return;
    }

    if (url.pathname === '/api/overview') {
      const days = DaysSchema.parse(url.searchParams.get('days'));
      const overview = await pipeline.fetchOverview(days);
      sendJSON(res, 200, overview, origin);
      return;
    }

    if (url.pathname === '/api/suggest') {
      const payloadSchema = z.object({
        network: NetworkIdSchema,
        q: z.string().min(1),
      });
      const payloadResult = payloadSchema.safeParse({
        network: url.searchParams.get('network'),
        q: url.searchParams.get('q'),
      });
      if (!payloadResult.success) {
        sendJSON(res, 400, { error: 'Invalid parameters', details: payloadResult.error.flatten() }, origin);
        return;
      }
      const suggestions = await fetchAccountSuggestions(payloadResult.data.network as Network, payloadResult.data.q);
      sendJSON(res, 200, { suggestions }, origin);
      return;
    }

    sendJSON(res, 404, { error: 'Not found' }, origin);
  } catch (error) {
    console.error('Failed to handle analytics request', error);
    sendJSON(res, 500, { error: 'Failed to compute analytics' }, origin);
  }
});

server.listen(PORT, () => {
  console.log(`✅ Analytics pipeline active on http://localhost:${PORT}`);
});
