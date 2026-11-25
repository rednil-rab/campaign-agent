import React from 'react';
import { useChatStore } from '../store/chat';
import { ActionCard } from './ActionCard';

export const MessageList: React.FC = () => {
  const messages = useChatStore((state) => state.messages);
  const messagesEndRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleApproveAction = (messageId: string) => {
    console.log('Approve action for message:', messageId);
    // TODO: Call API to approve action
  };

  const handleRejectAction = (messageId: string) => {
    console.log('Reject action for message:', messageId);
    // TODO: Call API to reject action
  };

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="empty-state">
          <p>No messages yet. Start by asking the agent for a suggestion!</p>
        </div>
      )}
      {messages.map((msg) => (
        <div key={msg.id} className={`message message-${msg.role}`}>
          <div className="message-content">{msg.content}</div>
          {msg.action && (
            <ActionCard
              action={msg.action as any}
              onApprove={() => handleApproveAction(msg.id)}
              onReject={() => handleRejectAction(msg.id)}
            />
          )}
          <div className="message-timestamp">{new Date(msg.timestamp).toLocaleTimeString()}</div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
