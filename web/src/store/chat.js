import { create } from 'zustand';
export const useChatStore = create((set) => ({
    campaignId: null,
    messages: [],
    loading: false,
    setCampaignId: (id) => set({ campaignId: id }),
    setMessages: (messages) => set({ messages }),
    addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),
    setLoading: (loading) => set({ loading }),
    clearMessages: () => set({ messages: [] }),
}));
