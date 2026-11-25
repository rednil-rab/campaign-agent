import { HttpError } from './errors';

export interface QkUser {
  id: string;
  email: string;
}

export interface QkCampaign {
  id: string;
  name: string;
  [key: string]: unknown;
}

export type EntityKind = 'npcs' | 'quests';

type Fetch = typeof fetch;

/** Talks to Questkeeper as the signed-in DM, using their own Questkeeper session cookie. */
export class QuestkeeperClient {
  constructor(
    private base: string,
    private fetchImpl: Fetch = fetch,
  ) {}

  private async request(path: string, init: RequestInit & { token?: string } = {}): Promise<Response> {
    const { token, ...rest } = init;
    const headers: Record<string, string> = { ...(rest.headers as Record<string, string>) };
    if (token) headers.Cookie = `qk_session=${token}`;
    if (rest.body) headers['Content-Type'] = 'application/json';
    let res: Response;
    try {
      res = await this.fetchImpl(`${this.base}${path}`, { ...rest, headers, signal: AbortSignal.timeout(10000) });
    } catch {
      throw new HttpError(502, 'Could not reach Questkeeper');
    }
    return res;
  }

  private async json<T>(res: Response): Promise<T> {
    if (res.status === 401) throw new HttpError(401, 'Your Questkeeper session has expired, please sign in again');
    if (!res.ok) throw new HttpError(res.status === 404 ? 404 : 502, `Questkeeper error (${res.status})`);
    return (await res.json()) as T;
  }

  async login(email: string, password: string): Promise<{ user: QkUser; token: string }> {
    const res = await this.request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
    if (res.status === 400 || res.status === 401) throw new HttpError(401, 'Invalid email or password');
    if (!res.ok) throw new HttpError(502, `Questkeeper error (${res.status})`);
    const cookie = res.headers.getSetCookie().find((c) => c.startsWith('qk_session='));
    const token = cookie?.slice('qk_session='.length).split(';')[0];
    if (!token) throw new HttpError(502, 'Questkeeper did not start a session');
    return { user: (await res.json()) as QkUser, token };
  }

  async listCampaigns(token: string): Promise<QkCampaign[]> {
    return this.json(await this.request('/campaigns', { token }));
  }

  async getCampaign(token: string, campaignId: string): Promise<QkCampaign> {
    const found = (await this.listCampaigns(token)).find((c) => c.id === campaignId);
    if (!found) throw new HttpError(404, 'Campaign not found');
    return found;
  }

  async saveEntity(token: string, campaignId: string, kind: EntityKind, entity: { id: string }): Promise<void> {
    const res = await this.request(`/campaigns/${encodeURIComponent(campaignId)}/${kind}/${encodeURIComponent(entity.id)}`, {
      method: 'PUT',
      token,
      body: JSON.stringify(entity),
    });
    if (res.status === 400) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new HttpError(400, body.error ?? 'Questkeeper rejected the change');
    }
    await this.json(res);
  }
}
