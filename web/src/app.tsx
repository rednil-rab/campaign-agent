import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './pages/LoginPage';
import { CampaignPicker } from './pages/CampaignPicker';
import { ChatPage } from './pages/ChatPage';
import './styles/chat.css';

export const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route path="/campaigns" element={<CampaignPicker />} />
        <Route path="/chat/:campaignId" element={<ChatPage />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
};
