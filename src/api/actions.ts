import { Router, Request, Response } from 'express';
import { ChatService } from '../services/chatService';
import { QuestkeeperAgentClient } from '../agent-client';

export function createActionsRouter() {
  const router = Router();
  const chatService = new ChatService();

  const requireDM = (req: Request, res: Response, next: any) => {
    if (!(req as any).dm) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  router.post('/:campaignId/actions/:actionId/apply', requireDM, async (req: Request, res: Response) => {
    try {
      const { campaignId, actionId } = req.params;
      const dm = (req as any).dm;

      const thread = await chatService.getThread(campaignId, dm.userId);
      if (!thread) {
        return res.status(404).json({ error: 'Thread not found' });
      }

      // Find the action in messages
      let action: any = null;
      for (const msg of thread.messages) {
        if (msg.action?.id === actionId) {
          action = msg.action;
          break;
        }
      }

      if (!action) {
        return res.status(404).json({ error: 'Action not found' });
      }

      if (action.status !== 'pending') {
        return res.status(400).json({ error: 'Action is not pending' });
      }

      // TODO: Call Questkeeper to apply the change
      // For now, just mark as applied
      action.status = 'applied';
      await thread.save();

      res.json({ status: 'applied' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  return router;
}
