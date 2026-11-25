import { ChatThread } from '../models/ChatThread';
import { Message, ChatThreadDoc } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  async getCampaigns(userId: string): Promise<{ id: string; name: string }[]> {
    // TODO: Call Questkeeper /campaigns endpoint
    return [];
  }

  async getOrCreateThread(campaignId: string, ownerId: string): Promise<ChatThreadDoc> {
    let thread = await ChatThread.findOne({ campaignId, ownerId });
    if (!thread) {
      thread = new ChatThread({
        campaignId,
        ownerId,
        messages: [],
      });
      await thread.save();
    }
    return thread;
  }

  async addMessage(campaignId: string, ownerId: string, role: 'user' | 'assistant', content: string, action?: any): Promise<Message> {
    const thread = await this.getOrCreateThread(campaignId, ownerId);
    const message: Message = {
      id: uuidv4(),
      role,
      content,
      timestamp: new Date(),
      action,
    };
    thread.messages.push(message);
    await thread.save();
    return message;
  }

  async getThread(campaignId: string, ownerId: string): Promise<ChatThreadDoc | null> {
    return ChatThread.findOne({ campaignId, ownerId });
  }
}
