import { describe, it, expect, beforeEach } from 'vitest';
import { useChatStore } from '../src/store/chat';

describe('Chat Store', () => {
  beforeEach(() => {
    // Reset store state before each test
    useChatStore.setState({
      campaignId: null,
      messages: [],
      loading: false,
    });
  });

  it('initializes with empty state', () => {
    const state = useChatStore.getState();
    expect(state.messages).toEqual([]);
    expect(state.campaignId).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('sets campaign ID', () => {
    useChatStore.getState().setCampaignId('campaign-123');
    const state = useChatStore.getState();
    expect(state.campaignId).toBe('campaign-123');
  });

  it('adds message to store', () => {
    const message = {
      id: 'msg-1',
      role: 'user' as const,
      content: 'Hello',
      timestamp: new Date(),
    };

    useChatStore.getState().addMessage(message);
    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0]).toEqual(message);
  });

  it('adds multiple messages in order', () => {
    const msg1 = { id: '1', role: 'user' as const, content: 'First', timestamp: new Date() };
    const msg2 = { id: '2', role: 'assistant' as const, content: 'Second', timestamp: new Date() };

    useChatStore.getState().addMessage(msg1);
    useChatStore.getState().addMessage(msg2);

    const state = useChatStore.getState();
    expect(state.messages).toHaveLength(2);
    expect(state.messages[0].content).toBe('First');
    expect(state.messages[1].content).toBe('Second');
  });

  it('sets loading state', () => {
    useChatStore.getState().setLoading(true);
    expect(useChatStore.getState().loading).toBe(true);

    useChatStore.getState().setLoading(false);
    expect(useChatStore.getState().loading).toBe(false);
  });

  it('clears messages', () => {
    const msg = { id: '1', role: 'user' as const, content: 'Test', timestamp: new Date() };
    useChatStore.getState().addMessage(msg);
    expect(useChatStore.getState().messages).toHaveLength(1);

    useChatStore.getState().clearMessages();
    expect(useChatStore.getState().messages).toHaveLength(0);
  });

  it('adds message with action', () => {
    const message = {
      id: 'msg-1',
      role: 'assistant' as const,
      content: 'Here is an NPC',
      timestamp: new Date(),
      action: {
        type: 'generate_npc' as const,
        status: 'pending' as const,
        payload: { name: 'Goblin', hp: 7 },
      },
    };

    useChatStore.getState().addMessage(message);
    const state = useChatStore.getState();
    expect(state.messages[0].action?.type).toBe('generate_npc');
    expect((state.messages[0].action?.payload as any)?.name).toBe('Goblin');
  });

  it('manages campaign ID and messages independently', () => {
    useChatStore.getState().setCampaignId('campaign-1');
    const msg = { id: '1', role: 'user' as const, content: 'Test', timestamp: new Date() };
    useChatStore.getState().addMessage(msg);

    expect(useChatStore.getState().campaignId).toBe('campaign-1');
    expect(useChatStore.getState().messages).toHaveLength(1);

    useChatStore.getState().setCampaignId('campaign-2');
    expect(useChatStore.getState().campaignId).toBe('campaign-2');
    // Messages persist when campaign changes
    expect(useChatStore.getState().messages).toHaveLength(1);
  });
});
