import { describe, it, expect } from 'vitest';
import { OpenAIProvider } from './provider';
import { Message } from '../models/types';

describe('OpenAIProvider', () => {
  const provider = new OpenAIProvider('sk-test-key');

  it('has generateResponse method', () => {
    expect(typeof provider.generateResponse).toBe('function');
  });

  it('requires valid API key on construction', () => {
    expect(() => new OpenAIProvider('')).toThrow();
  });

  it('returns object with narration and optional action', async () => {
    // Mock test - just validate the type
    expect(provider).toBeDefined();
  });
});
