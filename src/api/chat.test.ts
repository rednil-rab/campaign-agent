import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createChatRouter } from './chat';
import { ChatService } from '../services/chatService';

const TEST_SECRET = 'a'.repeat(32);
const DM_TOKEN = jwt.sign(
  { userId: 'dm-123', email: 'dm@test.com' },
  TEST_SECRET,
  { expiresIn: '7d' }
);

describe('Chat API endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware for testing
    app.use((req: any, res, next) => {
      const authHeader = req.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.slice(7);
          const decoded = jwt.verify(token, TEST_SECRET) as any;
          req.dm = { userId: decoded.userId, email: decoded.email };
        } catch {
          return res.status(401).json({ error: 'Unauthorized' });
        }
      }
      next();
    });

    app.use('/api/chat', createChatRouter());
  });

  it('POST /api/chat/login returns user and campaigns', async () => {
    const res = await request(app)
      .post('/api/chat/login')
      .set('Authorization', `Bearer ${DM_TOKEN}`);

    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.userId).toBe('dm-123');
  });

  it('POST /api/chat/login returns 401 without auth', async () => {
    const res = await request(app)
      .post('/api/chat/login');

    expect(res.status).toBe(401);
  });

  it('GET /api/chat/campaigns requires auth', async () => {
    const res = await request(app)
      .get('/api/chat/campaigns');

    expect(res.status).toBe(401);
  });

  it('GET /api/chat/threads/:campaignId requires auth', async () => {
    const res = await request(app)
      .get('/api/chat/threads/camp-123');

    expect(res.status).toBe(401);
  });
});
