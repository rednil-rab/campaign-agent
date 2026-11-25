import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@questkeeper/theme';
import { useChatStore } from '../store/chat';
import { api, errorMessage, isUnauthorized } from '../api/client';

export const MessageInput: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const [content, setContent] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const loading = useChatStore((s) => s.loading);
  const setLoading = useChatStore((s) => s.setLoading);
  const addMessages = useChatStore((s) => s.addMessages);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.sendMessage(campaignId, text);
      addMessages(...res.data.messages);
      setContent('');
    } catch (err) {
      if (isUnauthorized(err)) navigate('/', { replace: true });
      else setError(errorMessage(err, 'Could not send your message'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={submit} className="message-input">
      <input
        className="input"
        type="text"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Ask for an NPC, encounter, quest hook or dice roll…"
        maxLength={2000}
        aria-label="Message"
        disabled={loading}
      />
      <Button type="submit" disabled={loading || !content.trim()}>{loading ? 'Thinking…' : 'Send'}</Button>
      {error && <p role="alert" className="error">{error}</p>}
    </form>
  );
};
