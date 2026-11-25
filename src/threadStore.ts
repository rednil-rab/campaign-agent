import { ChatThread } from './models/ChatThread';
import type { ActionStatus, Message } from './models/types';

/** Chat history, always scoped by owner so one DM can never read another's threads. */
export interface ThreadStore {
  messages(ownerId: string, campaignId: string): Promise<Message[]>;
  append(ownerId: string, campaignId: string, ...messages: Message[]): Promise<void>;
  /** Moves a pending action to a final status. Returns false if it was not pending (or not found). */
  resolveAction(ownerId: string, campaignId: string, actionId: string, status: ActionStatus): Promise<boolean>;
}

export class MemoryThreadStore implements ThreadStore {
  private threads = new Map<string, Message[]>();
  private key = (o: string, c: string) => `${o}:${c}`;

  async messages(ownerId: string, campaignId: string) {
    return structuredClone(this.threads.get(this.key(ownerId, campaignId)) ?? []);
  }

  async append(ownerId: string, campaignId: string, ...messages: Message[]) {
    const k = this.key(ownerId, campaignId);
    this.threads.set(k, [...(this.threads.get(k) ?? []), ...structuredClone(messages)]);
  }

  async resolveAction(ownerId: string, campaignId: string, actionId: string, status: ActionStatus) {
    const action = this.threads.get(this.key(ownerId, campaignId))?.find((m) => m.action?.id === actionId)?.action;
    if (!action || action.status !== 'pending') return false;
    action.status = status;
    return true;
  }
}

export class MongoThreadStore implements ThreadStore {
  async messages(ownerId: string, campaignId: string) {
    const thread = await ChatThread.findOne({ ownerId, campaignId }).lean();
    return (thread?.messages ?? []) as Message[];
  }

  async append(ownerId: string, campaignId: string, ...messages: Message[]) {
    await ChatThread.updateOne(
      { ownerId, campaignId },
      { $push: { messages: { $each: messages } } },
      { upsert: true },
    );
  }

  async resolveAction(ownerId: string, campaignId: string, actionId: string, status: ActionStatus) {
    const res = await ChatThread.updateOne(
      { ownerId, campaignId, messages: { $elemMatch: { 'action.id': actionId, 'action.status': 'pending' } } },
      { $set: { 'messages.$.action.status': status } },
    );
    return res.modifiedCount === 1;
  }
}
