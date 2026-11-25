import type { ToolName } from '../models/types';

const fn = (name: ToolName, description: string, properties: Record<string, unknown>, required: string[]) => ({
  type: 'function' as const,
  function: { name, description, parameters: { type: 'object', properties, required } },
});

export const tools = [
  fn(
    'generate_npc',
    'Create a new NPC the DM can add to the campaign',
    {
      name: { type: 'string', description: 'NPC name' },
      role: { type: 'string', description: 'Role in the campaign (shopkeeper, villain, ally, etc)' },
      location: { type: 'string', description: 'Where the NPC is usually found' },
      disposition: { type: 'string', enum: ['ally', 'neutral', 'hostile', 'unknown'] },
      appearance: { type: 'string', description: 'Physical description' },
      personality: { type: 'string', description: 'Personality traits and quirks' },
      motivation: { type: 'string', description: 'What drives this NPC' },
    },
    ['name', 'role'],
  ),
  fn(
    'generate_encounter',
    'Describe an encounter (enemies, terrain, rewards). Informational only; it is not saved to the campaign',
    {
      name: { type: 'string' },
      difficulty: { type: 'string', enum: ['easy', 'medium', 'hard', 'deadly'] },
      enemies: { type: 'array', items: { type: 'string' }, description: 'Enemies with counts, names and gear' },
      terrain: { type: 'string' },
      treasures: { type: 'array', items: { type: 'string' } },
    },
    ['name', 'difficulty'],
  ),
  fn(
    'suggest_quest_hook',
    'Suggest a quest the DM can add to the campaign',
    {
      title: { type: 'string' },
      summary: { type: 'string', description: 'Short summary of the quest' },
      reward: { type: 'string' },
      complications: { type: 'array', items: { type: 'string' } },
    },
    ['title', 'summary'],
  ),
  fn(
    'roll_dice',
    'Roll dice for a check, attack or damage',
    {
      dice: { type: 'string', description: 'Dice notation such as 1d20+5 or 2d6' },
      reason: { type: 'string', description: 'What the roll is for' },
    },
    ['dice'],
  ),
];

export const TOOL_NAMES: readonly ToolName[] = ['generate_npc', 'generate_encounter', 'suggest_quest_hook', 'roll_dice'];
