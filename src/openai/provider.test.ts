import { describe, expect, it, vi } from 'vitest';
import { OpenAIProvider } from './provider';

function providerReturning(message: unknown) {
  const create = vi.fn().mockResolvedValue({ choices: [{ message }] });
  const provider = new OpenAIProvider('sk-test', 'test-model');
  (provider as unknown as { client: unknown }).client = { chat: { completions: { create } } };
  return { provider, create };
}

const call = (name: string, args: string) => ({ type: 'function', id: 'c1', function: { name, arguments: args } });

describe('OpenAIProvider', () => {
  it('requires an API key', () => {
    expect(() => new OpenAIProvider('')).toThrow('API key');
  });

  it('sends tools in the chat-completions function format with the campaign context and chat history', async () => {
    const { provider, create } = providerReturning({ content: 'ok' });
    await provider.generateResponse('Campaign: X', [{ id: '1', role: 'user', content: 'earlier', timestamp: new Date() }], 'now');
    const req = create.mock.calls[0][0];
    expect(req.model).toBe('test-model');
    expect(req.tools.every((t: { type: string; function: { name: string } }) => t.type === 'function' && t.function.name)).toBe(true);
    expect(req.messages[0].content).toContain('Campaign: X');
    expect(req.messages.map((m: { content: string }) => m.content).slice(1)).toEqual(['earlier', 'now']);
  });

  it('returns a parsed tool call as an action', async () => {
    const { provider } = providerReturning({ content: null, tool_calls: [call('generate_npc', '{"name":"Goby","role":"Brigand"}')] });
    const res = await provider.generateResponse('', [], 'npc');
    expect(res).toEqual({ narration: '', action: { type: 'generate_npc', payload: { name: 'Goby', role: 'Brigand' } } });
  });

  it('ignores unknown tools and malformed arguments instead of returning them as actions', async () => {
    const unknown = providerReturning({ content: 'text', tool_calls: [call('delete_campaign', '{}')] });
    expect((await unknown.provider.generateResponse('', [], 'x')).action).toBeUndefined();
    const malformed = providerReturning({ content: 'text', tool_calls: [call('generate_npc', '{oops')] });
    expect(await malformed.provider.generateResponse('', [], 'x')).toEqual({ narration: 'text' });
  });

  it('turns an OpenAI failure into a 502 without leaking details', async () => {
    const provider = new OpenAIProvider('sk-test');
    (provider as unknown as { client: unknown }).client = { chat: { completions: { create: vi.fn().mockRejectedValue(new Error('secret detail')) } } };
    await expect(provider.generateResponse('', [], 'x')).rejects.toMatchObject({ status: 502, message: expect.not.stringContaining('secret') });
  });
});
