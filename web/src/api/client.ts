import axios from 'axios';

export const apiClient = axios.create({ baseURL: '/api', withCredentials: true });

export const errorMessage = (err: unknown, fallback = 'Something went wrong'): string =>
  (axios.isAxiosError(err) && err.response?.data?.error) || fallback;

export const isUnauthorized = (err: unknown): boolean => axios.isAxiosError(err) && err.response?.status === 401;

export const api = {
  login: (email: string, password: string) => apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  me: () => apiClient.get('/auth/me'),
  getCampaigns: () => apiClient.get('/chat/campaigns'),
  getThread: (campaignId: string) => apiClient.get(`/chat/threads/${campaignId}`),
  sendMessage: (campaignId: string, content: string) =>
    apiClient.post(`/chat/threads/${campaignId}/messages`, { content }),
  applyAction: (campaignId: string, actionId: string) =>
    apiClient.post(`/chat/threads/${campaignId}/actions/${actionId}/apply`),
  rejectAction: (campaignId: string, actionId: string) =>
    apiClient.post(`/chat/threads/${campaignId}/actions/${actionId}/reject`),
};
