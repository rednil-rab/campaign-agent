import { beforeEach, describe, expect, it } from 'vitest';
import { useChatStore, type Message } from './chat';

const msg = (id: string, extra: Partial<Message> = {}): Message => ({
  id,
  role: 'assistant',
  content: id,
  timestamp: '2026-01-01T00:00:00.000Z',
  ...extra,
});

describe('chat store', () => {
  beforeEach(() => useChatStore.setState({ campaignId: null, messages: [], loading: false }));

  it('appends messages in order', () => {
    useChatStore.getState().addMessages(msg('1'), msg('2'));
    useChatStore.getState().addMessages(msg('3'));
    expect(useChatStore.getState().messages.map((m) => m.id)).toEqual(['1', '2', '3']);
  });

  it('updates only the matching action status', () => {
    const action = (id: string) => ({ id, type: 'generate_npc' as const, payload: {}, status: 'pending' as const });
    useChatStore.getState().setMessages([msg('1', { action: action('a1') }), msg('2', { action: action('a2') })]);
    useChatStore.getState().setActionStatus('a2', 'applied');
    const [first, second] = useChatStore.getState().messages;
    expect(first.action?.status).toBe('pending');
    expect(second.action?.status).toBe('applied');
  });

  it('clears messages when switching campaign', () => {
    useChatStore.getState().addMessages(msg('1'));
    useChatStore.getState().clearMessages();
    expect(useChatStore.getState().messages).toEqual([]);
  });
});
