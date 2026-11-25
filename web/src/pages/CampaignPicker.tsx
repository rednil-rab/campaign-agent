import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useChatStore } from '../store/chat';
import { chatAPI } from '../api/client';

interface Campaign {
  id: string;
  name: string;
}

export const CampaignPicker: React.FC = () => {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const setCampaignId = useChatStore((state) => state.setCampaignId);
  const navigate = useNavigate();

  React.useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const res = await chatAPI.getCampaigns();
        setCampaigns(res.data);
      } catch (err) {
        console.error('Error loading campaigns:', err);
        setError('Failed to load campaigns');
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const handleSelectCampaign = (campaignId: string) => {
    setCampaignId(campaignId);
    navigate(`/chat/${campaignId}`);
  };

  if (loading) return <div className="campaign-picker"><p>Loading campaigns...</p></div>;
  if (error) return <div className="campaign-picker"><p className="error">{error}</p></div>;

  return (
    <div className="campaign-picker">
      <h1>Select a Campaign</h1>
      {campaigns.length === 0 ? (
        <p>No campaigns found. Create one in Questkeeper to get started.</p>
      ) : (
        <div className="campaign-list">
          {campaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="campaign-card"
              onClick={() => handleSelectCampaign(campaign.id)}
            >
              <h2>{campaign.name}</h2>
              <p>Click to open chat</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
