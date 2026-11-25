import React from 'react';
import { Button, Tag, type TagTone } from '@questkeeper/theme';
import { type Action } from '../store/chat';

const LABELS: Record<Action['type'], string> = {
  generate_npc: 'NPC',
  generate_encounter: 'Encounter',
  suggest_quest_hook: 'Quest',
  roll_dice: 'Dice',
};

const STATUS: Record<Action['status'], { label: string; tone: TagTone }> = {
  pending: { label: 'not added yet', tone: 'amber' },
  applied: { label: 'added to campaign', tone: 'cyan' },
  rejected: { label: 'dismissed', tone: 'muted' },
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
    <div className="panel action-card">
      <div className="action-header">
        <Tag tone="cyan">{LABELS[action.type]}</Tag>
        <Tag tone={STATUS[action.status].tone}>{STATUS[action.status].label}</Tag>
      </div>
      {action.status === 'pending' && (
        <div className="action-buttons">
          <Button disabled={busy} onClick={() => run(onApply)}>Add to campaign</Button>
          <Button variant="ghost" disabled={busy} onClick={() => run(onReject)}>Dismiss</Button>
        </div>
      )}
      {error && <p role="alert" className="error">{error}</p>}
    </div>
  );
};
