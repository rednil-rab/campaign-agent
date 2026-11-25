import React from 'react';
import { useChatStore } from '../store/chat';
import { api, errorMessage } from '../api/client';
import { ActionCard } from './ActionCard';

export const MessageList: React.FC<{ campaignId: string }> = ({ campaignId }) => {
  const messages = useChatStore((s) => s.messages);
  const setActionStatus = useChatStore((s) => s.setActionStatus);
  const endRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth' });
  }, [messages]);

  const apply = async (actionId: string) => {
    try {
      await api.applyAction(campaignId, actionId);
    } catch (err) {
      throw new Error(errorMessage(err, 'Could not add this to the campaign'));
    }
    setActionStatus(actionId, 'applied');
  };

  const reject = async (actionId: string) => {
    try {
      await api.rejectAction(campaignId, actionId);
    } catch (err) {
      throw new Error(errorMessage(err, 'Could not dismiss this'));
    }
    setActionStatus(actionId, 'rejected');
  };

  return (
    <div className="message-list">
      {messages.length === 0 && (
        <div className="empty-state muted">
          <p>Ask for an NPC, an encounter, a quest hook, or a dice roll.</p>
        </div>
      )}
      {messages.map((m) => (
        <div key={m.id} className={`message message--${m.role}`}>
          <div className="message-content">{m.content}</div>
          {m.action && (
            <ActionCard
              action={m.action}
              campaignId={campaignId}
              onApply={() => apply(m.action!.id)}
              onReject={() => reject(m.action!.id)}
            />
          )}
        </div>
      ))}
      <div ref={endRef} />
    </div>
  );
};
