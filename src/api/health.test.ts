import { describe, it, expect, beforeEach } from 'vitest';
import express, { Application } from 'express';
import request from 'supertest';
import { createHealthRouter } from './health';

describe('Health endpoint', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use('/health', createHealthRouter());
  });

  it('GET /health returns ok status', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });
});
