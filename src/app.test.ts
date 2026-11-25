import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from './app';
import type { Config } from './config';
import { QuestkeeperClient } from './questkeeper';
import { MemoryThreadStore } from './threadStore';
import type { ChatProvider, GenerateResponseResult } from './openai/provider';

const baseConfig: Config = {
  port: 0,
  mongodbUri: 'unused',
  mongodbDb: 'unused',
  jwtSecret: 'a'.repeat(32),
  questkeeperBase: 'http://qk.test/api',
  openaiKey: 'unused',
  openaiModel: 'unused',
  dailyMessageLimit: 100,
  secureCookies: false,
};

// A tiny stand-in for Questkeeper: two DMs, each owning one campaign.
function fakeQuestkeeper() {
  const users: Record<string, { id: string; password: string; token: string; campaign: { id: string; name: string } }> = {
    'a@x.com': { id: 'user-a', password: 'password-a', token: 'tok-a', campaign: { id: 'camp-a', name: 'Ashen Crown' } },
    'b@x.com': { id: 'user-b', password: 'password-b', token: 'tok-b', campaign: { id: 'camp-b', name: 'Other' } },
  };
  const saved: { token: string; path: string; body: unknown }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit = {}) => {
    const p = new URL(url).pathname.replace('/api', '');
    const cookie = (init.headers as Record<string, string>)?.Cookie ?? '';
    const owner = Object.values(users).find((u) => cookie === `qk_session=${u.token}`);
    if (p === '/auth/login') {
      const { email, password } = JSON.parse(String(init.body));
      const u = users[email];
      if (!u || u.password !== password) return new Response('{}', { status: 401 });
      return new Response(JSON.stringify({ id: u.id, email }), {
        status: 200,
        headers: { 'set-cookie': `qk_session=${u.token}; Path=/; HttpOnly` },
      });
    }
    if (!owner) return new Response('{}', { status: 401 });
    if (p === '/campaigns') {
      return new Response(JSON.stringify([{ ...owner.campaign, npcs: [{ name: 'Mira', role: 'Smith', disposition: 'ally' }], quests: [], sessions: [] }]));
    }
    if (init.method === 'PUT') {
      saved.push({ token: owner.token, path: p, body: JSON.parse(String(init.body)) });
      return new Response('{}');
    }
    return new Response('{}', { status: 404 });
  }) as typeof fetch;
  return { client: new QuestkeeperClient('http://qk.test/api', fetchImpl), saved, expire: (email: string) => (users[email].token = 'expired') };
}

class FakeProvider implements ChatProvider {
  next: GenerateResponseResult = { narration: 'Hello' };
  seen: { context: string; history: number; message: string }[] = [];
  async generateResponse(context: string, history: unknown[], message: string) {
    this.seen.push({ context, history: history.length, message });
    return this.next;
  }
}

describe('agent chat app', () => {
  let provider: FakeProvider;
  let qk: ReturnType<typeof fakeQuestkeeper>;
  let config: Config;
  const build = () =>
    createApp({ config, questkeeper: qk.client, provider, threads: new MemoryThreadStore() });

  const signIn = async (app: ReturnType<typeof build>, email = 'a@x.com', password = 'password-a') => {
    const agent = request.agent(app);
    await agent.post('/api/auth/login').send({ email, password }).expect(200);
    return agent;
  };

  beforeEach(() => {
    provider = new FakeProvider();
    qk = fakeQuestkeeper();
    config = { ...baseConfig };
  });

  describe('auth', () => {
    it('signs in with Questkeeper credentials and sets an httpOnly cookie without exposing the Questkeeper token', async () => {
      const res = await request(build()).post('/api/auth/login').send({ email: 'a@x.com', password: 'password-a' });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ id: 'user-a', email: 'a@x.com' });
      const cookie = String(res.headers['set-cookie']);
      expect(cookie).toMatch(/qa_session=/);
      expect(cookie).toMatch(/HttpOnly/);
      expect(JSON.stringify(res.body)).not.toContain('tok-a');
    });

    it('rejects wrong credentials', async () => {
      const res = await request(build()).post('/api/auth/login').send({ email: 'a@x.com', password: 'nope-nope' });
      expect(res.status).toBe(401);
    });

    it('locks out an address after too many sign-in attempts', async () => {
      const app = build();
      for (let i = 0; i < 10; i++) await request(app).post('/api/auth/login').send({ email: 'a@x.com', password: 'wrong-pass' });
      const res = await request(app).post('/api/auth/login').send({ email: 'a@x.com', password: 'password-a' });
      expect(res.status).toBe(429);
    });

    it('ends our session when Questkeeper rejects the stored one, so the web app cannot loop between login and campaigns', async () => {
      const agent = await signIn(build());
      qk.expire('a@x.com');
      const res = await agent.get('/api/chat/campaigns');
      expect(res.status).toBe(401);
      expect(String(res.headers['set-cookie'])).toMatch(/qa_session=;/);
      expect((await agent.get('/api/auth/me')).status).toBe(401);
    });

    it('protects chat routes', async () => {
      const app = build();
      expect((await request(app).get('/api/chat/campaigns')).status).toBe(401);
      expect((await request(app).get('/api/auth/me')).status).toBe(401);
    });

    it('rejects a session cookie signed with another secret', async () => {
      const other = createApp({ config: { ...config, jwtSecret: 'b'.repeat(32) }, questkeeper: qk.client, provider, threads: new MemoryThreadStore() });
      const stolen = await request(other).post('/api/auth/login').send({ email: 'a@x.com', password: 'password-a' });
      const res = await request(build()).get('/api/chat/campaigns').set('Cookie', stolen.headers['set-cookie']);
      expect(res.status).toBe(401);
    });
  });

  describe('chat', () => {
    it('lists only the signed-in DM\'s campaigns', async () => {
      const agent = await signIn(build());
      const res = await agent.get('/api/chat/campaigns');
      expect(res.body).toEqual([{ id: 'camp-a', name: 'Ashen Crown' }]);
    });

    it('saves both messages, sends campaign context and earlier history to the model, and returns the thread', async () => {
      const agent = await signIn(build());
      await agent.post('/api/chat/threads/camp-a/messages').send({ content: 'Who is the smith?' }).expect(201);
      const res = await agent.post('/api/chat/threads/camp-a/messages').send({ content: 'And again?' });
      expect(res.body.messages.map((m: { role: string }) => m.role)).toEqual(['user', 'assistant']);
      expect(provider.seen[0].context).toContain('Mira');
      expect(provider.seen[1].history).toBe(2);
      const thread = await agent.get('/api/chat/threads/camp-a');
      expect(thread.body.messages).toHaveLength(4);
    });

    it('does not let one DM read or write another DM\'s campaign', async () => {
      const app = build();
      const a = await signIn(app);
      await a.post('/api/chat/threads/camp-a/messages').send({ content: 'secret plan' }).expect(201);
      const b = await signIn(app, 'b@x.com', 'password-b');
      expect((await b.get('/api/chat/threads/camp-a')).status).toBe(404);
      expect((await b.post('/api/chat/threads/camp-a/messages').send({ content: 'hi' })).status).toBe(404);
    });

    it('rejects empty and oversized messages without calling the model', async () => {
      const agent = await signIn(build());
      expect((await agent.post('/api/chat/threads/camp-a/messages').send({ content: '   ' })).status).toBe(400);
      expect((await agent.post('/api/chat/threads/camp-a/messages').send({ content: 'x'.repeat(2001) })).status).toBe(400);
      expect(provider.seen).toHaveLength(0);
    });

    it('stops answering once the daily message limit is reached', async () => {
      config.dailyMessageLimit = 2;
      const agent = await signIn(build());
      await agent.post('/api/chat/threads/camp-a/messages').send({ content: 'one' }).expect(201);
      await agent.post('/api/chat/threads/camp-a/messages').send({ content: 'two' }).expect(201);
      const res = await agent.post('/api/chat/threads/camp-a/messages').send({ content: 'three' });
      expect(res.status).toBe(429);
      expect(provider.seen).toHaveLength(2);
    });

    it('rolls dice on the server for roll_dice suggestions and adds no action', async () => {
      provider.next = { narration: 'Rolling.', action: { type: 'roll_dice', payload: { dice: '2d6+1' } } };
      const agent = await signIn(build());
      const res = await agent.post('/api/chat/threads/camp-a/messages').send({ content: 'roll damage' });
      const assistant = res.body.messages[1];
      expect(assistant.content).toMatch(/2d6\+1 → \d+/);
      expect(assistant.action).toBeUndefined();
    });

    it('shows encounters as text only', async () => {
      provider.next = { narration: '', action: { type: 'generate_encounter', payload: { name: 'Tavern brawl', difficulty: 'medium', enemies: ['2 orcs with clubs'] } } };
      const agent = await signIn(build());
      const assistant = (await agent.post('/api/chat/threads/camp-a/messages').send({ content: 'encounter' })).body.messages[1];
      expect(assistant.content).toContain('Tavern brawl');
      expect(assistant.content).toContain('2 orcs with clubs');
      expect(assistant.action).toBeUndefined();
    });
  });

  describe('approving suggestions', () => {
    const npcSuggestion: GenerateResponseResult = {
      narration: 'Here you go.',
      action: { type: 'generate_npc', payload: { name: 'Goby', role: 'Brigand', disposition: 'hostile', appearance: 'Scarred' } },
    };

    const suggest = async (agent: ReturnType<typeof request.agent>) => {
      provider.next = npcSuggestion;
      const res = await agent.post('/api/chat/threads/camp-a/messages').send({ content: 'make an npc' });
      return res.body.messages[1].action as { id: string; status: string };
    };

    it('saves an approved NPC to Questkeeper as the DM, then marks it applied exactly once', async () => {
      const agent = await signIn(build());
      const action = await suggest(agent);
      expect(action.status).toBe('pending');

      await agent.post(`/api/chat/threads/camp-a/actions/${action.id}/apply`).expect(200);
      expect(qk.saved).toHaveLength(1);
      expect(qk.saved[0]).toMatchObject({
        token: 'tok-a',
        path: `/campaigns/camp-a/npcs/${action.id}`,
        body: { id: action.id, name: 'Goby', role: 'Brigand', disposition: 'hostile' },
      });
      expect((await agent.post(`/api/chat/threads/camp-a/actions/${action.id}/apply`)).status).toBe(409);
      expect(qk.saved).toHaveLength(1);
      const thread = await agent.get('/api/chat/threads/camp-a');
      expect(thread.body.messages[1].action.status).toBe('applied');
    });

    it('saves quest hooks as dormant quests', async () => {
      provider.next = { narration: '', action: { type: 'suggest_quest_hook', payload: { title: 'Missing cart', summary: 'A cart vanished.' } } };
      const agent = await signIn(build());
      const action = (await agent.post('/api/chat/threads/camp-a/messages').send({ content: 'quest' })).body.messages[1].action;
      await agent.post(`/api/chat/threads/camp-a/actions/${action.id}/apply`).expect(200);
      expect(qk.saved[0].body).toMatchObject({ title: 'Missing cart', status: 'dormant', prerequisiteQuestIds: [] });
    });

    it('does not save a rejected suggestion', async () => {
      const agent = await signIn(build());
      const action = await suggest(agent);
      await agent.post(`/api/chat/threads/camp-a/actions/${action.id}/reject`).expect(200);
      expect((await agent.post(`/api/chat/threads/camp-a/actions/${action.id}/apply`)).status).toBe(409);
      expect(qk.saved).toHaveLength(0);
    });

    it('leaves the suggestion pending when Questkeeper fails, so it can be retried', async () => {
      const failing = new QuestkeeperClient('http://qk.test/api', (async (url: string, init?: RequestInit) =>
        init?.method === 'PUT' ? new Response('{}', { status: 500 }) : ((await (qk.client as any).fetchImpl(url, init)) as Response)) as typeof fetch);
      const app = createApp({ config, questkeeper: failing, provider, threads: new MemoryThreadStore() });
      const agent = await signIn(app);
      const action = await suggest(agent);
      expect((await agent.post(`/api/chat/threads/camp-a/actions/${action.id}/apply`)).status).toBe(502);
      expect((await agent.get('/api/chat/threads/camp-a')).body.messages[1].action.status).toBe('pending');
    });

    it('cannot approve another DM\'s suggestion', async () => {
      const app = build();
      const a = await signIn(app);
      const action = await suggest(a);
      const b = await signIn(app, 'b@x.com', 'password-b');
      expect((await b.post(`/api/chat/threads/camp-a/actions/${action.id}/apply`)).status).toBe(404);
    });
  });

  describe('web app', () => {
    it('serves the built web app and falls back to index.html for client routes, but not for /api', async () => {
      const dir = mkdtempSync(path.join(tmpdir(), 'web-'));
      writeFileSync(path.join(dir, 'index.html'), '<div id="root">app</div>');
      config.webDir = dir;
      const app = build();
      expect((await request(app).get('/campaigns')).text).toContain('app');
      const api = await request(app).get('/api/nope');
      expect(api.status).toBe(404);
      expect(api.body).toEqual({ error: 'Not found' });
    });
  });
});
