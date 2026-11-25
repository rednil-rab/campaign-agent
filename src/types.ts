export interface RecapTurn {
  turnId: string;
  mode: 'recap';
  campaignId: string;
  input: string;
  callbackBase: string;
  callbackToken: string;
  limits: { maxOutputTokens: number };
}

export interface DmContext {
  campaign: { name: string };
}

export interface TurnResponse {
  turnId: string;
  narration: string;
  events: [];
  applied: [];
  usage: { inputTokens: number; outputTokens: number; costUsd: number };
}

export interface Provider {
  recap(context: DmContext, input: string, maxOutputTokens: number): Promise<TurnResponse['narration']>;
}
