import type { Request, Response } from 'express';
import { config } from '../config/index.js';
import { getFirestore } from '../firebase/index.js';
import { checkOpenAIHealth } from '../services/ai.service.js';
import { checkNewsProvidersHealth } from '../services/news.service.js';
import type { SystemHealth } from '@nexora/shared';

const VERSION = '1.0.0';

let requestCount = 0;
let errorCount = 0;

export function incrementRequestCount(): void { requestCount++; }
export function incrementErrorCount(): void { errorCount++; }

export class HealthController {
  async health(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
  }

  async live(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, status: 'alive', uptime: process.uptime() });
  }

  async ready(_req: Request, res: Response): Promise<void> {
    try {
      await getFirestore().collection('users').limit(1).get();
      res.json({ success: true, status: 'ready' });
    } catch {
      res.status(503).json({ success: false, status: 'not ready' });
    }
  }

  async version(_req: Request, res: Response): Promise<void> {
    res.json({ success: true, version: VERSION, node: process.version, env: config.env });
  }

  async metrics(_req: Request, res: Response): Promise<void> {
    res.json({
      success: true,
      data: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        requests: requestCount,
        errors: errorCount,
        timestamp: new Date().toISOString(),
      },
    });
  }

  async detailed(_req: Request, res: Response): Promise<void> {
    const [openai, newsProviders] = await Promise.all([
      checkOpenAIHealth(),
      checkNewsProvidersHealth(),
    ]);

    let firestoreHealthy = false;
    try {
      await getFirestore().collection('users').limit(1).get();
      firestoreHealthy = true;
    } catch { /* degraded */ }

    const health: SystemHealth = {
      status: firestoreHealthy && (openai || Object.values(newsProviders).some(Boolean)) ? 'healthy' : 'degraded',
      uptime: process.uptime(),
      firestore: firestoreHealthy,
      openai,
      newsProviders,
      lastChecked: new Date().toISOString(),
    };

    res.json({ success: true, data: health });
  }
}

export const healthController = new HealthController();
