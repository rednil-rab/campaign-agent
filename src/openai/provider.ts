import OpenAI from 'openai';
import { TOOL_NAMES, tools } from './tools';
import type { Message, ToolName } from '../models/types';
import { HttpError } from '../errors';

export interface GenerateResponseResult {
  narration: string;
  action?: { type: ToolName; payload: Record<string, unknown> };
}

export interface ChatProvider {
  generateResponse(context: string, history: Message[], userMessage: string): Promise<GenerateResponseResult>;
}

const SYSTEM_PROMPT = `You are an assistant for a tabletop RPG dungeon master. Answer only what the DM asks; do not volunteer extra content.
Use the tools when the DM asks you to create an NPC, an encounter or a quest, or to roll dice. Keep replies short and usable at the table.
You may use simple Markdown (bold, lists). Never invent facts about the campaign that are not in the context.`;

export class OpenAIProvider implements ChatProvider {
  private client: OpenAI;

  constructor(
    apiKey: string,
    private model = 'gpt-4o-mini',
  ) {
    if (!apiKey) throw new Error('OpenAI API key is required');
    this.client = new OpenAI({ apiKey, timeout: 30_000 });
  }

  async generateResponse(context: string, history: Message[], userMessage: string): Promise<GenerateResponseResult> {
    let message: OpenAI.Chat.ChatCompletionMessage;
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: `${SYSTEM_PROMPT}\n\nCampaign context:\n${context}` },
          ...history.map((m) => ({ role: m.role, content: m.content })),
          { role: 'user', content: userMessage },
        ],
        tools,
        tool_choice: 'auto',
        temperature: 0.8,
        max_tokens: 700,
      });
      message = response.choices[0].message;
    } catch (err) {
      console.error('OpenAI request failed', err instanceof Error ? err.message : err);
      throw new HttpError(502, 'The assistant is unavailable right now, please try again');
    }

    const call = message.tool_calls?.find((c) => c.type === 'function');
    const name = call?.type === 'function' ? (call.function.name as ToolName) : undefined;
    if (call?.type === 'function' && name && TOOL_NAMES.includes(name)) {
      try {
        const payload = JSON.parse(call.function.arguments);
        if (payload && typeof payload === 'object' && !Array.isArray(payload)) {
          return { narration: message.content ?? '', action: { type: name, payload } };
        }
      } catch {
        // Malformed tool arguments: fall through and answer with the text alone.
      }
    }
    return { narration: message.content ?? '' };
  }
}
