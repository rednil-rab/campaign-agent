import express, { Express, Request, Response, NextFunction } from 'express';
import { createHealthRouter } from './api/health';
import { HttpError } from './errors';

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(express.json({ limit: '16kb' }));

  // Routes
  app.use('/health', createHealthRouter());

  // Error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    if (err instanceof HttpError) {
      res.status(err.status).json({ error: err.message });
    } else if (err instanceof SyntaxError) {
      res.status(400).json({ error: 'Invalid JSON' });
    } else {
      console.error('Unexpected error', err);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  });

  return app;
}

