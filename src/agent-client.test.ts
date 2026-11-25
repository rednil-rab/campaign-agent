import { describe, it, expect } from 'vitest';
import { QuestkeeperAgentClient } from './agent-client';

describe('QuestkeeperAgentClient', () => {
  const client = new QuestkeeperAgentClient('http://localhost:3000/api', 'test-token');

  it('has getDmContext method', () => {
    expect(typeof client.getDmContext).toBe('function');
  });

  it('has applyChange method', () => {
    expect(typeof client.applyChange).toBe('function');
  });

  it('has rollDice method', () => {
    expect(typeof client.rollDice).toBe('function');
  });

  it('has addEvent method', () => {
    expect(typeof client.addEvent).toBe('function');
  });
});
