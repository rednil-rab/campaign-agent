import axios from 'axios';

const API_BASE = '/api';

export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

export const chatAPI = {
  login: () => apiClient.post('/chat/login'),
  getCampaigns: () => apiClient.get('/chat/campaigns'),
  getThread: (campaignId: string) => apiClient.get(`/chat/threads/${campaignId}`),
  sendMessage: (campaignId: string, content: string) =>
    apiClient.post(`/chat/threads/${campaignId}/messages`, { content }),
  applyAction: (campaignId: string, actionId: string) =>
    apiClient.post(`/chat/threads/${campaignId}/actions/${actionId}/apply`),
};
