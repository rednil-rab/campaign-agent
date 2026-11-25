import React from 'react';
import { useChatStore } from '../store/chat';
import { chatAPI } from '../api/client';

interface Campaign {
  id: string;
  name: string;
}

export const CampaignPicker: React.FC = () => {
  const [campaigns, setCampaigns] = React.useState<Campaign[]>([]);
  const [loading, setLoading] = React.useState(true);
  const setCampaignId = useChatStore((state) => state.setCampaignId);

  React.useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const res = await chatAPI.getCampaigns();
        setCampaigns(res.data);
      } catch (err) {
        console.error('Error loading campaigns:', err);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, []);

  const handleSelectCampaign = (campaignId: string) => {
    setCampaignId(campaignId);
    // Navigation will be handled by routing
  };

  if (loading) return <div>Loading campaigns...</div>;

  return (
    <div className="campaign-picker">
      <h1>Select a Campaign</h1>
      <div className="campaign-list">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="campaign-card" onClick={() => handleSelectCampaign(campaign.id)}>
            {campaign.name}
          </div>
        ))}
      </div>
    </div>
  );
};
