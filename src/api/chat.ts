import { Router, Request, Response } from 'express';
import { ChatService } from '../services/chatService';
import { OpenAIProvider } from '../openai/provider';
import { QuestkeeperAgentClient } from '../agent-client';
import { HttpError } from '../errors';

export function createChatRouter() {
  const router = Router();
  const chatService = new ChatService();

  // Middleware to require DM auth
  const requireDM = (req: Request, res: Response, next: any) => {
    if (!(req as any).dm) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  router.post('/login', requireDM, async (req: Request, res: Response) => {
    try {
      const dm = (req as any).dm;
      const campaigns = await chatService.getCampaigns(dm.userId);
      res.json({ user: dm, campaigns });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/campaigns', requireDM, async (req: Request, res: Response) => {
    try {
      const dm = (req as any).dm;
      const campaigns = await chatService.getCampaigns(dm.userId);
      res.json(campaigns);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.get('/threads/:campaignId', requireDM, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const dm = (req as any).dm;
      const thread = await chatService.getThread(campaignId, dm.userId);
      res.json(thread || { messages: [] });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  router.post('/threads/:campaignId/messages', requireDM, async (req: Request, res: Response) => {
    try {
      const { campaignId } = req.params;
      const { content } = req.body;
      const dm = (req as any).dm;

      if (!content || typeof content !== 'string') {
        return res.status(400).json({ error: 'Content is required' });
      }

      // Add user message
      await chatService.addMessage(campaignId, dm.userId, 'user', content);

      // Get thread history
      const thread = await chatService.getThread(campaignId, dm.userId);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      // TODO: Get campaign context from Questkeeper
      // TODO: Call OpenAI to generate response
      // TODO: Parse response and add assistant message

      res.json({ message: { role: 'assistant', content: 'TODO: implement' } });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
