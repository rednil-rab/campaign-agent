import jwt from 'jsonwebtoken';
import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../errors';

export const SESSION_COOKIE = 'qa_session';
export const SESSION_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export interface DmSession {
  userId: string;
  email: string;
  /** The DM's Questkeeper session, kept only inside our httpOnly cookie. */
  qkToken: string;
}

declare global {
  namespace Express {
    interface Request {
      dm?: DmSession;
    }
  }
}

export const signSession = (dm: DmSession, secret: string): string =>
  jwt.sign({ email: dm.email, qk: dm.qkToken }, secret, {
    subject: dm.userId,
    expiresIn: Math.floor(SESSION_MAX_AGE_MS / 1000),
  });

function readCookie(header: string | undefined, name: string): string | undefined {
  for (const part of (header ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return undefined;
}

export function requireDm(secret: string) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const token = readCookie(req.headers.cookie, SESSION_COOKIE);
    if (!token) throw new HttpError(401, 'Not signed in');
    try {
      const p = jwt.verify(token, secret);
      if (typeof p === 'string' || !p.sub || typeof p.email !== 'string' || typeof p.qk !== 'string') {
        throw new Error('bad payload');
      }
      req.dm = { userId: p.sub, email: p.email, qkToken: p.qk };
    } catch {
      throw new HttpError(401, 'Not signed in');
    }
    next();
  };
}
