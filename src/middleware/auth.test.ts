import { describe, it, expect, beforeEach } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { authenticateDM } from './auth';

const TEST_SECRET = 'a'.repeat(32);

describe('authenticateDM middleware', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use(authenticateDM(TEST_SECRET));
    app.get('/protected', (req, res) => {
      res.json({ dm: (req as any).dm });
    });
  });

  it('extracts DM from valid Bearer token', async () => {
    const token = jwt.sign(
      { userId: 'dm-123', email: 'dm@example.com' },
      TEST_SECRET,
      { expiresIn: '7d' }
    );

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.dm.userId).toBe('dm-123');
    expect(res.body.dm.email).toBe('dm@example.com');
  });

  it('returns 401 for invalid token', async () => {
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token.here');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Unauthorized');
  });

  it('returns 401 for expired token', async () => {
    const token = jwt.sign(
      { userId: 'dm-123', email: 'dm@example.com' },
      TEST_SECRET,
      { expiresIn: '0s' }
    );

    // Wait a bit to ensure expiration
    await new Promise(r => setTimeout(r, 10));

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(401);
  });
});
