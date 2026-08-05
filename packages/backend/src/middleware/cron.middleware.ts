import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/index.js';

export function verifyCronSecret(req: Request, res: Response, next: NextFunction): void {
  if (!config.cronSecret) {
    res.status(503).json({ success: false, error: 'Cron not configured' });
    return;
  }

  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : req.headers['x-cron-secret'];

  if (token !== config.cronSecret) {
    res.status(401).json({ success: false, error: 'Unauthorized' });
    return;
  }

  next();
}
