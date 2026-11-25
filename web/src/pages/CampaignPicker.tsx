import React from 'react';
import { useNavigate } from 'react-router-dom';
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

  if (loading) return <div className="campaign-picker"><p>Loading campaigns…</p></div>;

  return (
    <div className="campaign-picker">
      <h1>Select a campaign</h1>
      {error && <p role="alert" className="error">{error}</p>}
      {!error && campaigns.length === 0 && <p>No campaigns found. Create one in Questkeeper first.</p>}
      <div className="campaign-list">
        {campaigns.map((c) => (
          <button key={c.id} className="campaign-card" onClick={() => open(c.id)}>
            <h2>{c.name}</h2>
          </button>
        ))}
      </div>
      <button className="link-button" onClick={signOut}>Sign out</button>
    </div>
  );
};
