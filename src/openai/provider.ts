import OpenAI from 'openai';
import { tools, ToolName } from './tools';
import { Message } from '../models/types';
import { HttpError } from '../errors';

export interface GenerateResponseResult {
  narration: string;
  action?: {
    type: ToolName;
    payload: unknown;
  };
}

export class OpenAIProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.client = new OpenAI({ apiKey });
  }

  async generateResponse(
    context: string,
    history: Message[],
    userMessage: string
  ): Promise<GenerateResponseResult> {
    const systemPrompt = `You are a D&D 5e game master assistant. Help the DM generate content, suggest encounters, and manage the campaign. When appropriate, use the provided tools to suggest specific mechanics or content.`;

    const messages = [
      {
        role: 'system' as const,
        content: `${systemPrompt}\n\nCampaign Context:\n${context}`,
      },
      ...history.map((msg) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })),
      {
        role: 'user' as const,
        content: userMessage,
      },
    ];

    try {
      const response = await this.client.chat.completions.create({
        model: 'gpt-4-turbo',
        messages: messages as OpenAI.ChatCompletionMessageParam[],
        tools: tools as unknown as OpenAI.Chat.ChatCompletionTool[],
        tool_choice: 'auto',
        temperature: 0.7,
      });

      const content = response.choices[0].message.content || '';

      // Check for tool call
      const toolCall = response.choices[0].message.tool_calls?.[0];
      if (toolCall && toolCall.type === 'function') {
        const fnName = toolCall.function.name as ToolName;
        let payload: unknown;
        try {
          payload = JSON.parse(toolCall.function.arguments);
        } catch {
          payload = toolCall.function.arguments;
        }

        return {
          narration: content,
          action: {
            type: fnName,
            payload,
          },
        };
      }

      return {
        narration: content,
      };
    } catch (err: any) {
      throw new HttpError(500, `OpenAI error: ${err.message}`);
    }
  }
}
