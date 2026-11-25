export const tools = [
  {
    name: 'generate_npc',
    description: 'Create a new NPC with stats, personality, and motivations',
    parameters: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'NPC name' },
        role: { type: 'string', description: 'Role in the campaign (shopkeeper, villain, ally, etc)' },
        class: { type: 'string', description: 'D&D class if applicable' },
        motivation: { type: 'string', description: 'What drives this NPC' },
        appearance: { type: 'string', description: 'Physical description' },
        personality: { type: 'string', description: 'Personality traits and quirks' },
      },
      required: ['name', 'role'],
    },
  },
  {
    name: 'generate_encounter',
    description: 'Create a combat or non-combat encounter with enemies, traps, or challenges',
    parameters: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Encounter name' },
        difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'deadly'], description: 'Encounter difficulty' },
        enemies: { type: 'array', items: { type: 'string' }, description: 'List of enemy types and counts' },
        terrain: { type: 'string', description: 'Encounter location and terrain' },
        treasures: { type: 'array', items: { type: 'string' }, description: 'Potential rewards' },
      },
      required: ['name', 'difficulty'],
    },
  },
  {
    name: 'suggest_quest_hook',
    description: 'Suggest an interesting plot hook or quest for the party',
    parameters: {
      type: 'object' as const,
      properties: {
        title: { type: 'string', description: 'Quest title' },
        giver: { type: 'string', description: 'NPC who offers the quest' },
        summary: { type: 'string', description: 'Short summary of the quest' },
        reward: { type: 'string', description: 'Reward for completion' },
        complications: { type: 'array', items: { type: 'string' }, description: 'Potential complications or plot twists' },
      },
      required: ['title', 'summary'],
    },
  },
  {
    name: 'roll_dice',
    description: 'Roll dice for a specific purpose (checks, damage, etc)',
    parameters: {
      type: 'object' as const,
      properties: {
        dice: { type: 'string', description: 'Dice notation (e.g., 1d20+5, 2d6)' },
        reason: { type: 'string', description: 'Why we are rolling (e.g., Attack roll, Perception check)' },
      },
      required: ['dice', 'reason'],
    },
  },
];

export type ToolName = 'generate_npc' | 'generate_encounter' | 'suggest_quest_hook' | 'roll_dice';
