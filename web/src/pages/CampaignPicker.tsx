import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@questkeeper/theme';
import { useChatStore } from '../store/chat';
import { api, errorMessage, isUnauthorized } from '../api/client';

interface Campaign {
  id: string;
  name: string;
}

export const CampaignPicker: React.FC = () => {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const setCampaignId = useChatStore((s) => s.setCampaignId);
  const navigate = useNavigate();

  React.useEffect(() => {
    api
      .getCampaigns()
      .then((res) => setCampaigns(res.data))
      .catch((err) => (isUnauthorized(err) ? navigate('/', { replace: true }) : setError(errorMessage(err, 'Failed to load campaigns'))))
      .finally(() => setLoading(false));
  }, [navigate]);

  const open = (id: string) => {
    setCampaignId(id);
    navigate(`/chat/${id}`);
  };

  const signOut = async () => {
    await api.logout().catch(() => undefined);
    navigate('/', { replace: true });
  };

  if (loading) return <main className="campaign-picker"><p className="muted">Loading campaigns…</p></main>;

  return (
    <main className="campaign-picker">
      <h1 className="page-title">Select a campaign</h1>
      {error && <p role="alert" className="error">{error}</p>}
      {!error && campaigns.length === 0 && <p className="muted">No campaigns found. Create one in Questkeeper first.</p>}
      <div className="campaign-list">
        {campaigns.map((c) => (
          <button key={c.id} type="button" className="panel campaign-card" onClick={() => open(c.id)}>
            <span className="panel__title">{c.name}</span>
          </button>
        ))}
      </div>
      <div>
        <Button variant="ghost" onClick={signOut}>Sign out</Button>
      </div>
    </main>
  );
};
