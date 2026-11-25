import React from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { useChatStore } from '../store/chat';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { chatAPI } from '../api/client';

export const ChatPage: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();
  const [campaign, setCampaign] = React.useState<{ id: string; name: string } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const storeId = useChatStore((state) => state.campaignId);

  React.useEffect(() => {
    if (!campaignId) return;

    const loadCampaignAndThread = async () => {
      try {
        // Load campaign metadata
        // TODO: Once getCampaigns returns detailed data, fetch single campaign
        setCampaign({ id: campaignId, name: `Campaign ${campaignId}` });

        // Load chat thread
        await chatAPI.getThread(campaignId);
        // TODO: Load messages into store
      } catch (err) {
        console.error('Error loading campaign:', err);
        setError('Failed to load campaign');
      } finally {
        setLoading(false);
      }
    };

    loadCampaignAndThread();
  }, [campaignId]);

  if (!campaignId || !storeId) {
    return <Navigate to="/campaigns" />;
  }

  if (loading) {
    return (
      <div className="chat-page">
        <header>
          <h1>Loading...</h1>
        </header>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-page">
        <header>
          <h1>Error</h1>
        </header>
        <div className="message-list">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-page">
      <header>
        <h1>{campaign?.name || `Chat - Campaign ${campaignId}`}</h1>
      </header>
      <MessageList />
      <MessageInput />
    </div>
  );
};
