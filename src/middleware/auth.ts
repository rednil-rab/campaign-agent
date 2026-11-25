import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { HttpError } from '../errors';

declare global {
  namespace Express {
    interface Request {
      dm?: { userId: string; email: string };
    }
  }
}

export function authenticateDM(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new HttpError(401, 'Unauthorized: missing or invalid authorization header');
      }

      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, secret) as { userId: string; email: string };

      req.dm = {
        userId: decoded.userId,
        email: decoded.email,
      };
      next();
    } catch (err) {
      if (err instanceof HttpError) {
        res.status(err.status).json({ error: err.message });
      } else {
        res.status(401).json({ error: 'Unauthorized' });
      }
    }
  };
}
