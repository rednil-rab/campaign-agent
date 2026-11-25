import React from 'react';
import { Navigate } from 'react-router-dom';
import { useChatStore } from '../store/chat';
import { MessageList } from '../components/MessageList';
import { MessageInput } from '../components/MessageInput';
import { chatAPI } from '../api/client';

export const ChatPage: React.FC = () => {
  const { campaignId } = useChatStore();

  React.useEffect(() => {
    if (!campaignId) return;

    const loadThread = async () => {
      try {
        await chatAPI.getThread(campaignId);
        // TODO: Load messages into store
      } catch (err) {
        console.error('Error loading thread:', err);
      }
    };

    loadThread();
  }, [campaignId]);

  if (!campaignId) {
    return <Navigate to="/campaigns" />;
  }

  return (
    <div className="chat-page">
      <header>
        <h1>Chat - Campaign {campaignId}</h1>
      </header>
      <MessageList />
      <MessageInput />
    </div>
  );
};
