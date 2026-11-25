import { HttpError } from './errors';

export class QuestkeeperAgentClient {
  constructor(private questkeeperBase: string, private agentToken: string) {}

  async getDmContext(campaignId: string): Promise<{ campaign: unknown }> {
    const url = `${this.questkeeperBase}/agent/v1/context/dm/${campaignId}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${this.agentToken}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw new HttpError(res.status, `Questkeeper error: ${res.statusText}`);
    }
    return res.json();
  }

  async applyChange(campaignId: string, change: unknown): Promise<{ status: string; reason?: string }> {
    const url = `${this.questkeeperBase}/agent/v1/changes/${campaignId}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.agentToken}`,
      },
      body: JSON.stringify(change),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      return { status: 'rejected', reason: `Questkeeper error: ${res.statusText}` };
    }
    return { status: 'applied' };
  }

  async rollDice(campaignId: string, dice: string, reason: string): Promise<{ total: number; rolls: number[]; modifier: number; text: string }> {
    const url = `${this.questkeeperBase}/agent/v1/roll/${campaignId}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.agentToken}`,
      },
      body: JSON.stringify({ dice, reason }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw new HttpError(res.status, `Dice roll failed: ${res.statusText}`);
    }
    return res.json();
  }

  async addEvent(campaignId: string, event: unknown): Promise<{ ok: boolean }> {
    const url = `${this.questkeeperBase}/agent/v1/events/${campaignId}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.agentToken}`,
      },
      body: JSON.stringify(event),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      throw new HttpError(res.status, `Event add failed: ${res.statusText}`);
    }
    return { ok: true };
  }
}
