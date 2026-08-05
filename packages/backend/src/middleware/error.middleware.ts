import type { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import { errorLogRepository } from '../repositories/index.js';
import { incrementErrorCount } from '../controllers/health.controller.js';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('Non-operational error', { error: err.message, stack: err.stack });
    }
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  incrementErrorCount();

  errorLogRepository.logError({
    level: 'error',
    message: err.message,
    stack: err.stack,
    path: req.path,
    userId: (req as { uid?: string }).uid,
    timestamp: new Date().toISOString(),
  }).catch(() => {});

  res.status(500).json({ success: false, error: 'Internal server error' });
}

export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({ success: false, error: 'Not found' });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
