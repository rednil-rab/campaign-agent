import React from 'react';
import { useChatStore } from '../store/chat';

export const MessageList: React.FC = () => {
  const messages = useChatStore((state) => state.messages);

  return (
    <div className="message-list">
      {messages.map((msg) => (
        <div key={msg.id} className={`message ${msg.role}`}>
          <div className="message-content">{msg.content}</div>
          {msg.action && (
            <div className="action-card">
              <div className="action-type">{msg.action.type}</div>
              <div className="action-status">{msg.action.status}</div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
