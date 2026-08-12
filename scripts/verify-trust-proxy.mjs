/**
 * Verifies express-rate-limit works behind a proxy when trust proxy is enabled.
 */
import express from 'express';
import rateLimit from 'express-rate-limit';

const app = express();
app.set('trust proxy', 1);
app.use(
  rateLimit({
    windowMs: 60_000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
  })
);
app.get('/test', (_req, res) => {
  res.json({ ok: true });
});

const server = app.listen(0, async () => {
  const { port } = server.address();
  try {
    const res = await fetch(`http://127.0.0.1:${port}/test`, {
      headers: { 'X-Forwarded-For': '203.0.113.1' },
    });
    const body = await res.json();
    if (res.status === 200 && body.ok) {
      console.log('✅ trust proxy + rate limit OK with X-Forwarded-For');
      process.exit(0);
    }
    console.error('❌ Unexpected response', res.status, body);
    process.exit(1);
  } catch (error) {
    console.error('❌ Request failed:', error);
    process.exit(1);
  } finally {
    server.close();
  }
});
