export interface Config {
  port: number;
  mongodbUri: string;
  mongodbDb: string;
  jwtSecret: string;
  questkeeperBase: string;
  openaiKey: string;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const jwtSecret = env.JWT_SECRET;
  if (!jwtSecret) throw new Error('JWT_SECRET is required');
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

  const mongodbUri = env.MONGODB_URI;
  if (!mongodbUri) throw new Error('MONGODB_URI is required');

  const openaiKey = env.OPENAI_API_KEY;
  if (!openaiKey) throw new Error('OPENAI_API_KEY is required');

  const port = Number(env.PORT ?? 3001);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be between 1 and 65535');
  }

  const mongodbDb = env.MONGODB_DB ?? 'questkeeper';
  const questkeeperBase = env.QUESTKEEPER_BASE ?? 'http://localhost:3000/api';

  return {
    port,
    mongodbUri,
    mongodbDb,
    jwtSecret,
    questkeeperBase,
    openaiKey,
  };
}

