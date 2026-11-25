import mongoose, { Schema, model, type Model } from 'mongoose';
import type { ChatThreadDoc } from './types';

const messageSchema = new Schema(
  {
    id: { type: String, required: true },
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, required: true },
    action: {
      id: String,
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
    campaignId: { type: String, required: true },
    ownerId: { type: String, required: true },
    messages: [messageSchema],
  },
  { timestamps: true }
);

chatThreadSchema.index({ ownerId: 1, campaignId: 1 }, { unique: true });

export const ChatThread: Model<ChatThreadDoc> =
  (mongoose.models.ChatThread as Model<ChatThreadDoc> | undefined) ?? model<ChatThreadDoc>('ChatThread', chatThreadSchema);
