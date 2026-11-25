import { describe, it, expect, beforeEach, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createActionsRouter } from './actions';

const TEST_SECRET = 'a'.repeat(32);
const DM_TOKEN = jwt.sign(
  { userId: 'dm-123', email: 'dm@test.com' },
  TEST_SECRET,
  { expiresIn: '7d' }
);

describe('Actions API endpoints', () => {
  let app: express.Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
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

    app.use('/api/chat/threads', createActionsRouter());
  });

  it('POST /api/chat/threads/:campaignId/actions/:actionId/apply requires auth', async () => {
    const res = await request(app)
      .post('/api/chat/threads/camp-123/actions/act-123/apply')
      .send({});

    expect(res.status).toBe(401);
  }, { timeout: 2000 });
}, { timeout: 30000 });

