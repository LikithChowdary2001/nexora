import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { config, validateConfig } from './config/index.js';
import { initializeFirebase } from './firebase/index.js';
import { globalRateLimiter } from './middleware/rateLimit.middleware.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';
import { incrementRequestCount } from './controllers/health.controller.js';
import userRoutes from './routes/user.routes.js';
import newsRoutes from './routes/news.routes.js';
import searchRoutes from './routes/search.routes.js';
import bookmarksRoutes from './routes/bookmarks.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';
import healthRoutes from './routes/health.routes.js';
import notificationsRoutes from './routes/notifications.routes.js';
import digestRoutes from './routes/digest.routes.js';
import cronRoutes from './routes/cron.routes.js';

validateConfig();
initializeFirebase();

const app = express();

app.use(helmet());
app.use(compression());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/cron', cronRoutes);
app.use(globalRateLimiter);

app.use((req, _res, next) => {
  incrementRequestCount();
  logger.debug(`${req.method} ${req.path}`);
  next();
});

app.use('/api/health', healthRoutes);

app.use('/api/users', userRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/bookmarks', bookmarksRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/digest', digestRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, '0.0.0.0', () => {
  logger.info(`Nexora API v1.0.0 running on port ${config.port}`, { env: config.env });
});

export default app;
