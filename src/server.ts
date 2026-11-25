import { createApp } from './app.js';
import { loadConfig } from './config.js';
import { fakeProvider } from './fakeProvider.js';

const config = loadConfig();
const server = createApp(config, fakeProvider);
server.listen(config.port, () => console.log(`Questkeeper agent listening on port ${config.port} (fake provider)`));

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close());
}
