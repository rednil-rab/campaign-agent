import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { startServer, stopServer } from './server';
import request from 'supertest';

describe('server', () => {
  it('starts and responds to health check', async () => {
    const app = await startServer({
      port: 3001,
      mongodbUri: 'mongodb://localhost:27017',
      mongodbDb: 'test-db',
      jwtSecret: 'a'.repeat(32),
      questkeeperBase: 'http://localhost:3000/api',
      openaiKey: 'sk-test',
    });

    try {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    } finally {
      await stopServer();
    }
  });
});
