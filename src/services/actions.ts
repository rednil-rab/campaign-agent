import type { QkCampaign, EntityKind } from '../questkeeper';
import type { ToolName } from '../models/types';

const str = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const list = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : []);
const section = (label: string, value: string) => (value ? `${label}: ${value}` : '');

/** Human-readable text for what the assistant suggested. */
export function describeAction(type: ToolName, p: Record<string, unknown>): string {
  const lines =
    type === 'generate_npc'
      ? [`**${str(p.name, 80)}** (${str(p.role, 80)})`, section('Location', str(p.location, 80)), section('Appearance', str(p.appearance, 500)), section('Personality', str(p.personality, 500)), section('Motivation', str(p.motivation, 500))]
      : type === 'generate_encounter'
        ? [`**${str(p.name, 120)}** (${str(p.difficulty, 20)})`, section('Terrain', str(p.terrain, 300)), section('Enemies', list(p.enemies).join('; ')), section('Treasure', list(p.treasures).join('; '))]
        : type === 'suggest_quest_hook'
          ? [`**${str(p.title, 120)}**`, str(p.summary, 1000), section('Reward', str(p.reward, 300)), section('Complications', list(p.complications).join('; '))]
          : [section('Roll', str(p.dice, 20))];
  return lines.filter(Boolean).join('\n');
}

export type SaveableAction = { kind: EntityKind; build: (id: string) => { id: string } & Record<string, unknown> };

/** Maps a suggestion onto a Questkeeper entity, or null when the suggestion is informational only. */
export function toEntity(type: ToolName, p: Record<string, unknown>): SaveableAction | null {
  if (type === 'generate_npc') {
    const disposition = ['ally', 'neutral', 'hostile', 'unknown'].includes(p.disposition as string)
      ? (p.disposition as string)
      : 'unknown';
    const description = [section('Appearance', str(p.appearance, 1500)), section('Personality', str(p.personality, 1500)), section('Motivation', str(p.motivation, 1500))]
      .filter(Boolean)
      .join('\n');
    return {
      kind: 'npcs',
      build: (id) => ({ id, name: str(p.name, 80) || 'Unnamed NPC', role: str(p.role, 80), location: str(p.location, 80), disposition, description }),
    };
  }
  if (type === 'suggest_quest_hook') {
    const description = [str(p.summary, 2500), section('Reward', str(p.reward, 500)), section('Complications', list(p.complications).join('; ').slice(0, 1500))]
      .filter(Boolean)
      .join('\n\n');
    return {
      kind: 'quests',
      build: (id) => ({ id, title: str(p.title, 120) || 'Untitled quest', status: 'dormant', description, prerequisiteQuestIds: [] }),
    };
  }
  return null;
}

const items = (v: unknown, fmt: (x: Record<string, unknown>) => string, limit: number): string => {
  const rows = Array.isArray(v) ? v.slice(0, limit) : [];
  return rows.map((x) => fmt(x as Record<string, unknown>)).filter(Boolean).join('\n');
};

/** A compact summary of the campaign for the model; never the whole document. */
export function campaignContext(c: QkCampaign): string {
  const npcs = items(c.npcs, (n) => `- ${str(n.name, 80)} (${str(n.role, 80)}, ${str(n.disposition, 20)})`, 40);
  const quests = items(c.quests, (q) => `- ${str(q.title, 120)} [${str(q.status, 20)}]`, 40);
  const sessions = (Array.isArray(c.sessions) ? c.sessions : []).slice(-3) as Record<string, unknown>[];
  const recaps = sessions.map((s) => `- Session ${s.number}: ${str(s.title, 120)}. ${str(s.summary, 600)}`).join('\n');
  return [`Campaign: ${str(c.name, 80)}`, npcs && `NPCs:\n${npcs}`, quests && `Quests:\n${quests}`, recaps && `Recent sessions:\n${recaps}`]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 6000);
}
