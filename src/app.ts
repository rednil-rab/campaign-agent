import { createHash, timingSafeEqual } from 'node:crypto';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import type { Config } from './config.js';
import { ServiceError } from './errors.js';
import { parseTurn, runTurn } from './turn.js';
import type { Provider } from './types.js';

const MAX_BODY_BYTES = 16_384;
const equalSecret = (a: string, b: string) =>
  timingSafeEqual(createHash('sha256').update(a).digest(), createHash('sha256').update(b).digest());

function send(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
    size += bytes.length;
    if (size > MAX_BODY_BYTES) throw new ServiceError('Request body too large', 413, 'bad_request');
    chunks.push(bytes);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown;
  } catch {
    throw new ServiceError('Invalid JSON', 400, 'bad_request');
  }
}

export function createApp(config: Config, provider: Provider) {
  return createServer(async (req, res) => {
    try {
      if (req.method === 'GET' && req.url === '/v1/health') return send(res, 200, { ok: true });
      if (req.method === 'GET' && req.url === '/v1/capabilities') {
        return send(res, 200, { modes: ['recap'], changeKinds: [], provider: 'fake' });
      }
      if (req.method !== 'POST' || req.url !== '/v1/turn') return send(res, 404, { error: 'Not found', code: 'bad_request' });
      const auth = req.headers.authorization;
      if (!auth?.startsWith('Bearer ') || !equalSecret(auth.slice(7), config.sharedSecret)) {
        throw new ServiceError('Unauthorized', 401, 'unauthorized');
      }
      const turn = parseTurn(await readJson(req), config.callbackBase);
      send(res, 200, await runTurn(turn, provider));
    } catch (error) {
      if (error instanceof ServiceError) return send(res, error.status, { error: error.message, code: error.code });
      console.error('Unexpected agent error', error);
      send(res, 500, { error: 'Internal server error', code: 'upstream_unavailable' });
    }
  });
}
