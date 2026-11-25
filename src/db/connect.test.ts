import { describe, it, expect } from 'vitest';
import { connectDb } from './connect';

describe('connectDb', () => {
  it('rejects an invalid connection string', async () => {
    await expect(connectDb({ mongodbUri: 'invalid://uri', mongodbDb: 'test' })).rejects.toThrow(/mongodb/i);
  });
});
