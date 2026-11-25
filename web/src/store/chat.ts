import { create } from 'zustand';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: {
    type?: string;
    payload?: unknown;
    status?: 'pending' | 'applied' | 'rejected';
  };
}

interface ChatState {
  campaignId: string | null;
  messages: Message[];
  loading: boolean;
  setCampaignId: (id: string) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  campaignId: null,
  messages: [],
  loading: false,
  setCampaignId: (id: string) => set({ campaignId: id }),
  setMessages: (messages: Message[]) => set({ messages }),
  addMessage: (message: Message) => set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading: boolean) => set({ loading }),
  clearMessages: () => set({ messages: [] }),
}));
