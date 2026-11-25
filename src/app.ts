import { existsSync } from 'node:fs';
import path from 'node:path';
import express, { type Express, type NextFunction, type Request, type Response } from 'express';
import { createAuthRouter } from './api/auth';
import { createChatRouter, type ChatDeps } from './api/chat';
import { createHealthRouter } from './api/health';
import { HttpError } from './errors';
import { SESSION_COOKIE } from './middleware/auth';

export function createApp(deps: ChatDeps): Express {
  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '16kb' }));

  app.use('/health', createHealthRouter());
  app.use('/api', (_req, res, next) => {
    res.setHeader('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/auth', createAuthRouter(deps.config, deps.questkeeper));
  app.use('/api/chat', createChatRouter(deps));
  app.use('/api', (_req, _res, next) => next(new HttpError(404, 'Not found')));

  const { webDir } = deps.config;
  if (webDir && existsSync(path.join(webDir, 'index.html'))) {
    const root = path.resolve(webDir);
    app.use(express.static(root));
    app.get(/^(?!\/api\/).*/, (_req, res) => res.sendFile(path.join(root, 'index.html')));
  }

  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof HttpError) {
      // A rejected session (ours or Questkeeper's) is dropped so the web app returns to the login form.
      if (err.status === 401 && !req.originalUrl.startsWith('/api/auth/login')) {
        res.clearCookie(SESSION_COOKIE, { httpOnly: true, sameSite: 'lax', secure: deps.config.secureCookies });
      }
      res.status(err.status).json({ error: err.message });
    } else if (err instanceof SyntaxError) {
      res.status(400).json({ error: 'Invalid JSON' });
    } else if ((err as { type?: string })?.type === 'entity.too.large') {
      res.status(413).json({ error: 'Request too large' });
    } else {
      console.error('Unexpected error', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return app;
}
