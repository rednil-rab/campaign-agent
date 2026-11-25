import React from 'react';
import { useChatStore } from '../store/chat';
import { chatAPI } from '../api/client';

export const MessageInput: React.FC = () => {
  const [content, setContent] = React.useState('');
  const { campaignId, loading, addMessage, setLoading } = useChatStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !campaignId || loading) return;

    try {
      setLoading(true);
      const userMsg = { id: Date.now().toString(), role: 'user' as const, content, timestamp: new Date() };
      addMessage(userMsg);

      const res = await chatAPI.sendMessage(campaignId, content);
      if (res.data.message) {
        addMessage(res.data.message);
      }

      setContent('');
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="message-input">
      <input
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Ask the AI..."
        disabled={loading}
      />
      <button type="submit" disabled={loading}>
        Send
      </button>
    </form>
  );
};
