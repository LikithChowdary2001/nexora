import { google } from 'googleapis';
import type { AnalyticsSnapshot } from '@nexora/shared';
import { config } from '../config/index.js';

let sheetsClient: ReturnType<typeof google.sheets> | null = null;

function getSheetsClient() {
  if (!sheetsClient) {
    if (!config.googleSheets.serviceAccountEmail || !config.googleSheets.privateKey) {
      return null;
    }

    const auth = new google.auth.JWT({
      email: config.googleSheets.serviceAccountEmail,
      key: config.googleSheets.privateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });

    sheetsClient = google.sheets({ version: 'v4', auth });
  }
  return sheetsClient;
}

export async function syncAnalyticsToSheets(snapshot: AnalyticsSnapshot): Promise<void> {
  const sheets = getSheetsClient();
  if (!sheets || !config.googleSheets.spreadsheetId) return;

  const row = [
    snapshot.date,
    snapshot.totalUsers,
    snapshot.activeUsers,
    snapshot.totalSearches,
    snapshot.totalArticlesRead,
    snapshot.aiUsageTokens,
    snapshot.errorCount,
    snapshot.popularInterests.map((i) => `${i.interest}:${i.count}`).join('; '),
    snapshot.popularSearches.map((s) => `${s.query}:${s.count}`).join('; '),
  ];

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.googleSheets.spreadsheetId,
    range: 'Analytics!A:I',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}

export async function readAnalyticsFromSheets(): Promise<string[][]> {
  const sheets = getSheetsClient();
  if (!sheets || !config.googleSheets.spreadsheetId) return [];

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: config.googleSheets.spreadsheetId,
    range: 'Analytics!A:I',
  });

  return (response.data.values as string[][]) ?? [];
}

export async function updateUserReport(userId: string, data: Record<string, string>): Promise<void> {
  const sheets = getSheetsClient();
  if (!sheets || !config.googleSheets.spreadsheetId) return;

  const row = [new Date().toISOString(), userId, ...Object.values(data)];

  await sheets.spreadsheets.values.append({
    spreadsheetId: config.googleSheets.spreadsheetId,
    range: 'Users!A:Z',
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  });
}
