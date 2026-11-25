import { Express } from 'express';
import { createApp } from './app';
import { loadConfig, Config } from './config';

let httpServer: any;

export async function startServer(config: Config): Promise<Express> {
  const app = createApp();

  return new Promise((resolve) => {
    httpServer = app.listen(config.port, () => {
      console.log(`Agent chat service listening on port ${config.port}`);
      resolve(app);
    });
  });
}

export async function stopServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!httpServer) return resolve();
    httpServer.close((err: any) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

// Main entry point
if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  startServer(config).catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, async () => {
      console.log(`Received ${signal}, shutting down...`);
      await stopServer();
      process.exit(0);
    });
  }
}
