import { describe, it, expect } from 'vitest';
import { ChatThread } from './ChatThread';
import { ChatThreadDoc } from './types';

describe('ChatThread model', () => {
  it('has correct schema fields', () => {
    const schema = ChatThread.schema;
    
    expect(schema.path('campaignId').instance).toBe('String');
    expect(schema.path('ownerId').instance).toBe('String');
    expect(schema.path('createdAt').instance).toBe('Date');
    expect(schema.path('updatedAt').instance).toBe('Date');
    expect(schema.path('messages').instance).toBe('Array');
  });

  it('requires campaignId and ownerId', () => {
    const schema = ChatThread.schema;
    
    expect(schema.path('campaignId').isRequired).toBe(true);
    expect(schema.path('ownerId').isRequired).toBe(true);
  });

  it('creates indexes for campaignId and ownerId', () => {
    const indexes = ChatThread.schema.indexes();
    const indexFields = indexes.map((idx: any) => Object.keys(idx[0]));
    
    expect(indexFields.some((fields: string[]) => fields.includes('campaignId'))).toBe(true);
    expect(indexFields.some((fields: string[]) => fields.includes('ownerId'))).toBe(true);
  });
});
