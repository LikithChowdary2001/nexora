import winston from 'winston';
import { config } from '../config/index.js';

const { combine, timestamp, json, colorize, printf } = winston.format;

const devFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  return `${ts} [${level}]: ${message}${metaStr}`;
});

export const logger = winston.createLogger({
  level: config.isDev ? 'debug' : 'info',
  defaultMeta: { service: 'nexora-api' },
  transports: [
    new winston.transports.Console({
      format: config.isDev
        ? combine(colorize(), timestamp(), devFormat)
        : combine(timestamp(), json()),
    }),
  ],
});

export const auditLogger = winston.createLogger({
  level: 'info',
  defaultMeta: { service: 'nexora-audit' },
  transports: [
    new winston.transports.Console({ format: combine(timestamp(), json()) }),
  ],
});

export const securityLogger = winston.createLogger({
  level: 'warn',
  defaultMeta: { service: 'nexora-security' },
  transports: [
    new winston.transports.Console({ format: combine(timestamp(), json()) }),
  ],
});
