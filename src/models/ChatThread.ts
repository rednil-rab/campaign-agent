import mongoose, { Schema, model } from 'mongoose';
import { ChatThreadDoc } from './types';

const messageSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, required: true },
    action: {
      type: {
        type: String,
        enum: ['generate_npc', 'generate_encounter', 'suggest_quest_hook', 'roll_dice'],
      },
      payload: Schema.Types.Mixed,
      status: {
        type: String,
        enum: ['pending', 'applied', 'rejected'],
      },
    },
  },
  { _id: false }
);

const chatThreadSchema = new Schema<ChatThreadDoc>(
  {
    campaignId: { type: String, required: true, index: true },
    ownerId: { type: String, required: true, index: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

export const ChatThread = model<ChatThreadDoc>('ChatThread', chatThreadSchema);
