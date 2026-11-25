import { pathToFileURL } from 'node:url';
import { createApp } from './app';
import { loadConfig } from './config';
import { connectDb } from './db/connect';
import { OpenAIProvider } from './openai/provider';
import { QuestkeeperClient } from './questkeeper';
import { MongoThreadStore } from './threadStore';

async function main() {
  const config = loadConfig();
  await connectDb(config);
  const app = createApp({
    config,
    questkeeper: new QuestkeeperClient(config.questkeeperBase),
    provider: new OpenAIProvider(config.openaiKey, config.openaiModel),
    threads: new MongoThreadStore(),
  });
  const server = app.listen(config.port, () => console.log(`Agent chat service listening on port ${config.port}`));

  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => server.close(() => process.exit(0)));
  }
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}
