import { create } from 'zustand';

export type ActionStatus = 'pending' | 'applied' | 'rejected';

export interface Action {
  id: string;
  type: 'generate_npc' | 'generate_encounter' | 'suggest_quest_hook' | 'roll_dice';
  payload: Record<string, unknown>;
  status: ActionStatus;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  action?: Action;
}

interface ChatState {
  campaignId: string | null;
  messages: Message[];
  loading: boolean;
  setCampaignId: (id: string) => void;
  setMessages: (messages: Message[]) => void;
  addMessages: (...messages: Message[]) => void;
  setActionStatus: (actionId: string, status: ActionStatus) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  campaignId: null,
  messages: [],
  loading: false,
  setCampaignId: (id) => set({ campaignId: id }),
  setMessages: (messages) => set({ messages }),
  addMessages: (...messages) => set((s) => ({ messages: [...s.messages, ...messages] })),
  setActionStatus: (actionId, status) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.action?.id === actionId ? { ...m, action: { ...m.action, status } } : m)),
    })),
  setLoading: (loading) => set({ loading }),
  clearMessages: () => set({ messages: [] }),
}));
