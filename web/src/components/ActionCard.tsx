import React from 'react';

interface Action {
  type: 'generate_npc' | 'generate_encounter' | 'suggest_quest_hook' | 'roll_dice';
  status: 'pending' | 'approved' | 'rejected' | 'applied';
  payload?: Record<string, unknown>;
}

interface ActionCardProps {
  action: Action;
  onApprove: () => void;
  onReject: () => void;
  disabled?: boolean;
}

export const ActionCard: React.FC<ActionCardProps> = ({ action, onApprove, onReject, disabled = false }) => {
  const renderPayload = () => {
    if (!action.payload) return null;

    return (
      <div className="action-payload">
        <pre>{JSON.stringify(action.payload, null, 2)}</pre>
      </div>
    );
  };

  return (
    <div className="action-card">
      <div className="action-header">
        <span className="action-type">{action.type.replace(/_/g, ' ')}</span>
        <span className={`action-status status-${action.status}`}>{action.status}</span>
      </div>
      {renderPayload()}
      {action.status === 'pending' && (
        <div className="action-buttons">
          <button onClick={onApprove} disabled={disabled} className="btn-approve">
            Approve
          </button>
          <button onClick={onReject} disabled={disabled} className="btn-reject">
            Reject
          </button>
        </div>
      )}
    </div>
  );
};
