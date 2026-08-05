#!/usr/bin/env node
/**
 * End-to-end API smoke test for Nexora production.
 * Usage: node scripts/e2e-api-test.mjs [baseUrl]
 */
const BASE = (process.argv[2] ?? 'https://nexora-dhn1.onrender.com/api').replace(/\/$/, '');

const results = [];

async function check(name, fn) {
  try {
    const detail = await fn();
    results.push({ name, ok: true, detail });
    console.log(`✅ ${name}${detail ? ` — ${detail}` : ''}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    results.push({ name, ok: false, detail: message });
    console.log(`❌ ${name} — ${message}`);
  }
}

async function get(path) {
  const res = await fetch(`${BASE}${path}`);
  const body = await res.text();
  let json;
  try { json = JSON.parse(body); } catch { json = body; }
  return { status: res.status, json };
}

async function post(path, body = {}, headers = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { status: res.status, json };
}

console.log(`\nNexora E2E API test → ${BASE}\n`);

await check('GET /health/live', async () => {
  const { status, json } = await get('/health/live');
  if (status !== 200 || !json.success) throw new Error(`status ${status}`);
  return json.status;
});

await check('GET /health/version', async () => {
  const { status, json } = await get('/health/version');
  if (status !== 200) throw new Error(`status ${status}`);
  return `v${json.version} node ${json.node}`;
});

await check('GET /health/ready (Firestore)', async () => {
  const { status, json } = await get('/health/ready');
  if (status === 200 && json.success) return 'Firestore OK';
  if (status === 503) return 'EXPECTED FAIL — enable Firestore in Firebase Console';
  throw new Error(`unexpected status ${status}`);
});

await check('GET /users/recommended-interests (public)', async () => {
  const { status, json } = await get('/users/recommended-interests?age=30&profession=Software+Engineer&country=United+States');
  if (status !== 200 || !json.success) throw new Error(`status ${status}`);
  return `${json.data?.length ?? 0} interests`;
});

await check('POST /users/bootstrap without token', async () => {
  const { status } = await post('/users/bootstrap');
  if (status !== 401) throw new Error(`expected 401, got ${status}`);
  return 'correctly rejected';
});

await check('POST /ai/chat without token', async () => {
  const { status } = await post('/ai/chat', { message: 'hi' });
  if (status !== 401) throw new Error(`expected 401, got ${status}`);
  return 'correctly rejected';
});

await check('GET /health/detailed (OpenAI + news)', async () => {
  const { status, json } = await get('/health/detailed');
  if (status !== 200) throw new Error(`status ${status}`);
  const d = json.data;
  return `firestore=${d.firestore} openai=${d.openai} news=${Object.values(d.newsProviders).filter(Boolean).length} providers`;
});

const failed = results.filter((r) => r.ok === false);
const firestoreDown = results.find((r) => r.name.includes('Firestore'))?.detail?.includes('EXPECTED FAIL');

console.log('\n--- Summary ---');
console.log(`Passed: ${results.length - failed.length}/${results.length}`);
if (firestoreDown) {
  console.log('\n⚠️  BLOCKER: Firestore is not enabled.');
  console.log('   Fix: https://console.firebase.google.com/project/nexora-28cf4/firestore → Create database');
  console.log('   Then: firebase deploy --only firestore:rules,firestore:indexes');
}
if (failed.length) {
  console.log('\nFailed checks:');
  failed.forEach((r) => console.log(`  - ${r.name}: ${r.detail}`));
  process.exit(1);
}
process.exit(firestoreDown ? 2 : 0);
