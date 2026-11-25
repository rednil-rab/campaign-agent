import React from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useChatStore } from '../store/chat';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { api, errorMessage, isUnauthorized } from '../api/client';

export const ChatPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const navigate = useNavigate();
  const { setCampaignId, setMessages, clearMessages } = useChatStore();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!campaignId) return;
    let cancelled = false;
    setCampaignId(campaignId);
    clearMessages();
    setLoading(true);
    setError(null);
    api
      .getThread(campaignId)
      .then((res) => !cancelled && setMessages(res.data.messages))
      .catch((err) => {
        if (cancelled) return;
        if (isUnauthorized(err)) navigate('/', { replace: true });
        else setError(errorMessage(err, 'Failed to load this campaign'));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [campaignId, navigate, setCampaignId, setMessages, clearMessages]);

  if (!campaignId) return null;

  return (
    <div className="chat-page">
      <header>
        <Link to="/campaigns">← Campaigns</Link>
      </header>
      {loading && <p className="empty-state">Loading…</p>}
      {error && <p role="alert" className="error empty-state">{error}</p>}
      {!loading && !error && (
        <>
          <MessageList campaignId={campaignId} />
          <MessageInput campaignId={campaignId} />
        </>
      )}
    </div>
  );
};
