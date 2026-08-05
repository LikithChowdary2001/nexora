import rateLimit from 'express-rate-limit';
import { config } from '../config/index.js';

export const globalRateLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later.' },
});

export const aiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { success: false, error: 'AI rate limit exceeded. Please wait.' },
});

export const searchRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { success: false, error: 'Search rate limit exceeded.' },
});

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, error: 'Too many auth attempts.' },
});
