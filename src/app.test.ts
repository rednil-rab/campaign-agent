import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import { createApp } from './app';
import { HttpError } from './errors';

describe('Express app', () => {
  it('health endpoint works without auth', async () => {
    const app = createApp();
    const res = await request(app).get('/health');
    
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('error handler returns error message in json', async () => {
    const app = express();
    app.use((req, res, next) => {
      next(new HttpError(400, 'Test error'));
    });
    app.use((err: any, req: any, res: any, next: any) => {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    });

    const res = await request(app).get('/');
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Test error' });
  });
});
