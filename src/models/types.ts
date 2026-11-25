export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: {
    type?: string;
    payload?: unknown;
    status?: 'pending' | 'applied' | 'rejected';
  };
}

export interface ChatThreadDoc {
  _id: string;
  campaignId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}
