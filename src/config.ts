export interface Config {
  port: number;
  mongodbUri: string;
  mongodbDb: string;
  jwtSecret: string;
  questkeeperBase: string;
  openaiKey: string;
  openaiModel: string;
  dailyMessageLimit: number;
  /** Messages across all DMs per 24h; bounds OpenAI spend however many accounts exist. */
  globalDailyMessageLimit: number;
  /** When non-empty, only these (lower-case) emails may use the assistant. */
  allowedEmails: string[];
  webDir?: string;
  secureCookies: boolean;
}

function positiveInt(value: string | undefined, fallback: number, name: string): number {
  if (value === undefined) return fallback;
  const n = Number(value);
  if (!Number.isInteger(n) || n < 1) throw new Error(`${name} must be a positive whole number`);
  return n;
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function questkeeperBase(env: NodeJS.ProcessEnv): string {
  const base = (env.QUESTKEEPER_BASE ?? 'http://localhost:3000/api').replace(/\/+$/, '');
  if (env.NODE_ENV === 'production') {
    let url: URL;
    try {
      url = new URL(base);
    } catch {
      throw new Error('QUESTKEEPER_BASE must be a valid URL');
    }
    if (url.protocol !== 'https:' && !LOCAL_HOSTS.has(url.hostname)) {
      throw new Error('QUESTKEEPER_BASE must use https in production');
    }
  }
  return base;
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

  return {
    port,
    mongodbUri,
    mongodbDb: env.MONGODB_DB ?? 'questkeeper',
    jwtSecret,
    questkeeperBase: questkeeperBase(env),
    openaiKey,
    openaiModel: env.OPENAI_MODEL ?? 'gpt-4o-mini',
    dailyMessageLimit: positiveInt(env.DAILY_MESSAGE_LIMIT, 50, 'DAILY_MESSAGE_LIMIT'),
    globalDailyMessageLimit: positiveInt(env.GLOBAL_DAILY_MESSAGE_LIMIT, 500, 'GLOBAL_DAILY_MESSAGE_LIMIT'),
    allowedEmails: (env.ALLOWED_EMAILS ?? '')
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    webDir: env.WEB_DIR || undefined,
    secureCookies: env.NODE_ENV === 'production',
  };
}
