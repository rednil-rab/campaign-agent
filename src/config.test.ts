import { describe, it, expect } from 'vitest';
import { loadConfig } from './config';

describe('loadConfig', () => {
  it('loads required config from env', () => {
    const env = {
      JWT_SECRET: 'a'.repeat(32),
      MONGODB_URI: 'mongodb://localhost:27017',
      OPENAI_API_KEY: 'sk-test-key',
    };
    
    const config = loadConfig(env);
    
    expect(config.jwtSecret).toBe(env.JWT_SECRET);
    expect(config.mongodbUri).toBe(env.MONGODB_URI);
    expect(config.openaiKey).toBe(env.OPENAI_API_KEY);
  });

  it('applies defaults for optional config', () => {
    const env = {
      JWT_SECRET: 'a'.repeat(32),
      MONGODB_URI: 'mongodb://localhost:27017',
      OPENAI_API_KEY: 'sk-test-key',
    };
    
    const config = loadConfig(env);
    
    expect(config.port).toBe(3001);
    expect(config.mongodbDb).toBe('questkeeper');
    expect(config.questkeeperBase).toBe('http://localhost:3000/api');
  });

  it('allows overriding optional config', () => {
    const env = {
      JWT_SECRET: 'a'.repeat(32),
      MONGODB_URI: 'mongodb://localhost:27017',
      OPENAI_API_KEY: 'sk-test-key',
      PORT: '4000',
      MONGODB_DB: 'test-db',
      QUESTKEEPER_BASE: 'http://example.com/api',
    };
    
    const config = loadConfig(env);
    
    expect(config.port).toBe(4000);
    expect(config.mongodbDb).toBe('test-db');
    expect(config.questkeeperBase).toBe('http://example.com/api');
  });

  it('throws when JWT_SECRET is missing', () => {
    const env = {
      MONGODB_URI: 'mongodb://localhost:27017',
      OPENAI_API_KEY: 'sk-test-key',
    };
    
    expect(() => loadConfig(env)).toThrow('JWT_SECRET');
  });

  it('throws when JWT_SECRET is too short', () => {
    const env = {
      JWT_SECRET: 'short',
      MONGODB_URI: 'mongodb://localhost:27017',
      OPENAI_API_KEY: 'sk-test-key',
    };
    
    expect(() => loadConfig(env)).toThrow('at least 32 characters');
  });

  it('throws when MONGODB_URI is missing', () => {
    const env = {
      JWT_SECRET: 'a'.repeat(32),
      OPENAI_API_KEY: 'sk-test-key',
    };
    
    expect(() => loadConfig(env)).toThrow('MONGODB_URI');
  });

  it('throws when OPENAI_API_KEY is missing', () => {
    const env = {
      JWT_SECRET: 'a'.repeat(32),
      MONGODB_URI: 'mongodb://localhost:27017',
    };
    
    expect(() => loadConfig(env)).toThrow('OPENAI_API_KEY');
  });
});
