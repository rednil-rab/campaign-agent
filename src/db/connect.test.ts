import { describe, it, expect } from 'vitest';
import { connectDb } from './connect';

describe('connectDb', () => {
  it('is an async function', async () => {
    expect(typeof connectDb).toBe('function');
  });

  it('throws on invalid URI', async () => {
    try {
      await connectDb({
        port: 3001,
        mongodbUri: 'invalid://uri',
        mongodbDb: 'test',
        jwtSecret: 'a'.repeat(32),
        questkeeperBase: 'http://localhost:3000/api',
        openaiKey: 'sk-test',
      });
      throw new Error('Should have thrown');
    } catch (err: any) {
      expect(err.message).toContain('connection');
    }
  });
});
