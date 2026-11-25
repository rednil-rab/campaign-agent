import { Router } from 'express';
import { HttpError } from '../errors';
import { RateLimiter } from '../rateLimit';
import { requireDm, signSession, SESSION_COOKIE, SESSION_MAX_AGE_MS } from '../middleware/auth';
import type { Config } from '../config';
import type { QuestkeeperClient } from '../questkeeper';

export function createAuthRouter(config: Config, questkeeper: QuestkeeperClient) {
  const router = Router();
  const attempts = new RateLimiter(10, 15 * 60 * 1000);
  const cookieOptions = { httpOnly: true, sameSite: 'lax' as const, secure: config.secureCookies };

  router.post('/login', async (req, res) => {
    if (!attempts.take(req.ip ?? 'unknown')) throw new HttpError(429, 'Too many sign-in attempts, try again later');
    const { email, password } = (req.body ?? {}) as Record<string, unknown>;
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password || email.length > 254 || password.length > 72) {
      throw new HttpError(400, 'Email and password are required');
    }
    const { user, token } = await questkeeper.login(email.trim().toLowerCase(), password);
    // Checked after Questkeeper confirms the password, so the list is not revealed to guessers.
    if (config.allowedEmails.length > 0 && !config.allowedEmails.includes(user.email.toLowerCase())) {
      throw new HttpError(403, 'This account is not allowed to use the assistant');
    }
    res.cookie(SESSION_COOKIE, signSession({ userId: user.id, email: user.email, qkToken: token }, config.jwtSecret), {
      ...cookieOptions,
      maxAge: SESSION_MAX_AGE_MS,
    });
    res.json({ id: user.id, email: user.email });
  });

  router.post('/logout', (_req, res) => {
    res.clearCookie(SESSION_COOKIE, cookieOptions);
    res.status(204).end();
  });

  router.get('/me', requireDm(config.jwtSecret), (req, res) => {
    res.json({ id: req.dm!.userId, email: req.dm!.email });
  });

  return router;
}
