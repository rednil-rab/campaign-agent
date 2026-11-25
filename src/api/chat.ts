import { randomInt, randomUUID } from 'node:crypto';
import { Router } from 'express';
import { HttpError } from '../errors';
import { RateLimiter } from '../rateLimit';
import { requireDm } from '../middleware/auth';
import { rollDice } from '../dice';
import { campaignContext, describeAction, sanitizePayload, toEntity } from '../services/actions';
import type { Config } from '../config';
import type { QuestkeeperClient } from '../questkeeper';
import type { ChatProvider } from '../openai/provider';
import type { ThreadStore } from '../threadStore';
import type { Message } from '../models/types';

export interface ChatDeps {
  config: Config;
  questkeeper: QuestkeeperClient;
  provider: ChatProvider;
  threads: ThreadStore;
}

const MAX_MESSAGE_CHARS = 2000;
const HISTORY_MESSAGES = 20;

export function createChatRouter({ config, questkeeper, provider, threads }: ChatDeps) {
  const router = Router();
  const daily = new RateLimiter(config.dailyMessageLimit, 24 * 60 * 60 * 1000);
  const global = new RateLimiter(config.globalDailyMessageLimit, 24 * 60 * 60 * 1000);
  router.use(requireDm(config.jwtSecret));
  router.use((req, _res, next) => {
    const { allowedEmails } = config;
    if (allowedEmails.length > 0 && !allowedEmails.includes(req.dm!.email.toLowerCase())) {
      throw new HttpError(403, 'This account is not allowed to use the assistant');
    }
    next();
  });

  router.get('/campaigns', async (req, res) => {
    const campaigns = await questkeeper.listCampaigns(req.dm!.qkToken);
    res.json(campaigns.map((c) => ({ id: c.id, name: c.name })));
  });

  // Questkeeper only returns campaigns the DM owns, so this also proves ownership.
  router.get('/threads/:campaignId', async (req, res) => {
    const { userId, qkToken } = req.dm!;
    await questkeeper.getCampaign(qkToken, req.params.campaignId);
    res.json({ messages: await threads.messages(userId, req.params.campaignId) });
  });

  router.post('/threads/:campaignId/messages', async (req, res) => {
    const { userId, qkToken } = req.dm!;
    const { campaignId } = req.params;
    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!content) throw new HttpError(400, 'Message is required');
    if (content.length > MAX_MESSAGE_CHARS) throw new HttpError(400, `Message must be at most ${MAX_MESSAGE_CHARS} characters`);

    const campaign = await questkeeper.getCampaign(qkToken, campaignId);
    if (!global.take('all')) throw new HttpError(429, 'The assistant has reached its daily limit, try again tomorrow');
    if (!daily.take(userId)) throw new HttpError(429, 'Daily message limit reached, try again tomorrow');

    const history = (await threads.messages(userId, campaignId)).slice(-HISTORY_MESSAGES);
    const result = await provider.generateResponse(campaignContext(campaign), history, content);

    const assistant: Message = { id: randomUUID(), role: 'assistant', content: result.narration, timestamp: new Date() };
    if (result.action) {
      const { type, payload } = result.action;
      if (type === 'roll_dice') {
        try {
          assistant.content = `${assistant.content}\n\n🎲 ${rollDice(String(payload.dice ?? ''), randomInt).text}`.trim();
        } catch (err) {
          assistant.content = `${assistant.content}\n\n(Could not roll: ${(err as Error).message})`.trim();
        }
      } else {
        const details = describeAction(type, payload);
        assistant.content = assistant.content ? `${assistant.content}\n\n${details}` : details;
        if (toEntity(type, payload)) assistant.action = { id: randomUUID(), type, payload: sanitizePayload(type, payload), status: 'pending' };
      }
    }
    if (!assistant.content) assistant.content = 'I could not come up with a response, please rephrase.';

    const user: Message = { id: randomUUID(), role: 'user', content, timestamp: new Date() };
    await threads.append(userId, campaignId, user, assistant);
    res.status(201).json({ messages: [user, assistant] });
  });

  router.post('/threads/:campaignId/actions/:actionId/apply', async (req, res) => {
    const { userId, qkToken } = req.dm!;
    const { campaignId, actionId } = req.params;
    const action = (await threads.messages(userId, campaignId)).find((m) => m.action?.id === actionId)?.action;
    if (!action) throw new HttpError(404, 'Action not found');
    if (action.status !== 'pending') throw new HttpError(409, 'Action was already handled');
    const saveable = toEntity(action.type, action.payload);
    if (!saveable) throw new HttpError(400, 'This suggestion cannot be added to the campaign');

    // The action id doubles as the entity id, so retrying after a failure just overwrites the same record.
    await questkeeper.saveEntity(qkToken, campaignId, saveable.kind, saveable.build(actionId));
    await threads.resolveAction(userId, campaignId, actionId, 'applied');
    res.json({ status: 'applied' });
  });

  router.post('/threads/:campaignId/actions/:actionId/reject', async (req, res) => {
    const { userId } = req.dm!;
    const ok = await threads.resolveAction(userId, req.params.campaignId, req.params.actionId, 'rejected');
    if (!ok) throw new HttpError(409, 'Action was not found or was already handled');
    res.json({ status: 'rejected' });
  });

  return router;
}
