export type ToolName = 'generate_npc' | 'generate_encounter' | 'suggest_quest_hook' | 'roll_dice';
export type ActionStatus = 'pending' | 'applied' | 'rejected';

export interface Action {
  id: string;
  type: ToolName;
  payload: Record<string, unknown>;
  status: ActionStatus;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  action?: Action;
}

export interface ChatThreadDoc {
  campaignId: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
  messages: Message[];
}
