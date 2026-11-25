import { normalizeCallbackBase } from './config.js';
import { ServiceError } from './errors.js';
import { QuestkeeperClient } from './questkeeperClient.js';
import type { Provider, RecapTurn, TurnResponse } from './types.js';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export function parseTurn(body: unknown, configuredBase: string): RecapTurn {
  if (!isRecord(body)) throw new ServiceError('Expected a JSON object', 400, 'bad_request');
  if (body.mode !== 'recap') throw new ServiceError('Only recap mode is supported', 400, 'bad_request');
  for (const key of ['turnId', 'campaignId', 'callbackToken', 'callbackBase'] as const) {
    if (typeof body[key] !== 'string' || !body[key].trim() || body[key].length > 4096) {
      throw new ServiceError(`Invalid ${key}`, 400, 'bad_request');
    }
  }
  if (typeof body.input !== 'string' || body.input.length > 2000) throw new ServiceError('Invalid input', 400, 'bad_request');
  if (!isRecord(body.limits) || !Number.isInteger(body.limits.maxOutputTokens) ||
      typeof body.limits.maxOutputTokens !== 'number' || body.limits.maxOutputTokens < 1 || body.limits.maxOutputTokens > 800) {
    throw new ServiceError('maxOutputTokens must be between 1 and 800', 400, 'bad_request');
  }
  const { turnId, campaignId, callbackToken, callbackBase, input } = body;
  if (typeof turnId !== 'string' || typeof campaignId !== 'string' || typeof callbackToken !== 'string' ||
      typeof callbackBase !== 'string') throw new ServiceError('Invalid turn', 400, 'bad_request');
  let normalized: string;
  try {
    normalized = normalizeCallbackBase(callbackBase);
  } catch {
    throw new ServiceError('Invalid callbackBase', 400, 'bad_request');
  }
  if (normalized !== configuredBase) throw new ServiceError('Untrusted callbackBase', 400, 'bad_request');
  return { turnId, campaignId, callbackToken, callbackBase: normalized, mode: 'recap', input,
    limits: { maxOutputTokens: body.limits.maxOutputTokens } };
}

export async function runTurn(turn: RecapTurn, provider: Provider): Promise<TurnResponse> {
  const context = await new QuestkeeperClient(turn.callbackBase, turn.callbackToken).getDmContext();
  const narration = await provider.recap(context, turn.input, turn.limits.maxOutputTokens);
  return { turnId: turn.turnId, narration, events: [], applied: [], usage: { inputTokens: 0, outputTokens: 0, costUsd: 0 } };
}
