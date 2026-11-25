import { ServiceError } from './errors.js';
import type { DmContext } from './types.js';

export class QuestkeeperClient {
  private readonly base: string;
  private readonly token: string;

  constructor(
    base: string,
    token: string,
  ) {
    this.base = base;
    this.token = token;
  }

  async getDmContext(): Promise<DmContext> {
    let response: Response;
    try {
      response = await fetch(`${this.base}/context/dm`, {
        headers: { authorization: `Bearer ${this.token}` },
        redirect: 'error',
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      throw new ServiceError('Questkeeper callback unavailable', 502, 'upstream_unavailable');
    }
    if (!response.ok) throw new ServiceError('Questkeeper callback rejected the request', 502, 'upstream_unavailable');
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      throw new ServiceError('Questkeeper returned invalid JSON', 502, 'upstream_unavailable');
    }
    if (!isDmContext(body)) throw new ServiceError('Questkeeper returned invalid context', 502, 'upstream_unavailable');
    return body;
  }
}

function isDmContext(value: unknown): value is DmContext {
  if (typeof value !== 'object' || value === null || !('campaign' in value)) return false;
  const campaign = value.campaign;
  return typeof campaign === 'object' && campaign !== null && 'name' in campaign && typeof campaign.name === 'string';
}
