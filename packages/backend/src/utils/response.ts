import type { Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import type { ApiResponse } from '@nexora/shared';

export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const body: ApiResponse<T> = { success: true, data };
  res.status(statusCode).json(body);
}

export function sendError(res: Response, error: string, statusCode = 400): void {
  const body: ApiResponse<never> = { success: false, error };
  res.status(statusCode).json(body);
}

export function getAuthContext(req: AuthenticatedRequest) {
  return { uid: req.uid, user: req.user };
}
