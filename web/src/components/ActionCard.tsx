import React from 'react';
import { type Action } from '../store/chat';

const LABELS: Record<Action['type'], string> = {
  generate_npc: 'NPC',
  generate_encounter: 'Encounter',
  suggest_quest_hook: 'Quest',
  roll_dice: 'Dice',
};

interface Props {
  action: Action;
  campaignId: string;
  onApply: () => Promise<void>;
  onReject: () => Promise<void>;
}

export const ActionCard: React.FC<Props> = ({ action, onApply, onReject }) => {
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="action-card">
      <div className="action-header">
        <span className="action-type">{LABELS[action.type]}</span>
        <span className={`action-status status-${action.status}`}>
          {action.status === 'pending' ? 'not added yet' : action.status === 'applied' ? 'added to campaign' : 'dismissed'}
        </span>
      </div>
      {action.status === 'pending' && (
        <div className="action-buttons">
          <button className="btn-approve" disabled={busy} onClick={() => run(onApply)}>Add to campaign</button>
          <button className="btn-reject" disabled={busy} onClick={() => run(onReject)}>Dismiss</button>
        </div>
      )}
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
};
