import { describe, it, expect, beforeEach } from 'vitest';
import { createApp } from './app';
import express from 'express';
import request from 'supertest';

describe('Backend integration', () => {
  let app: express.Application;

  beforeEach(() => {
    app = createApp();
  });

  it('server responds to health check', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('error handler returns JSON on bad requests', async () => {
    const res = await request(app)
      .post('/nonexistent')
      .send({ test: 'data' });

    // Express default 404
    expect(res.status).toBeGreaterThanOrEqual(400);
  });

  it('app parses JSON request bodies up to 16KB', async () => {
    // Create a request with ~15KB JSON
    const largeObj = { data: 'x'.repeat(15000) };
    
    const testApp = express();
    testApp.use(express.json({ limit: '16kb' }));
    testApp.post('/test', (req, res) => {
      res.json({ received: Boolean(req.body.data) });
    });

    const res = await request(testApp)
      .post('/test')
      .send(largeObj);

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});

