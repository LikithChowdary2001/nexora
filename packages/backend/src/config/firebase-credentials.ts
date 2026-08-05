export interface FirebaseAdminCredentials {
  projectId: string;
  clientEmail: string;
  privateKey: string;
  storageBucket: string;
}

/** Normalize private keys pasted into Render / .env (quotes, literal \\n, etc.). */
export function parsePrivateKey(raw: string): string {
  if (!raw) return '';

  let key = raw.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  if (key.includes('\\n')) {
    key = key.replace(/\\n/g, '\n');
  }

  return key;
}

function fromServiceAccountJson(json: string): FirebaseAdminCredentials | null {
  try {
    const parsed = JSON.parse(json) as {
      project_id?: string;
      client_email?: string;
      private_key?: string;
    };

    if (!parsed.project_id || !parsed.client_email || !parsed.private_key) {
      return null;
    }

    return {
      projectId: parsed.project_id,
      clientEmail: parsed.client_email,
      privateKey: parsePrivateKey(parsed.private_key),
      storageBucket: `${parsed.project_id}.firebasestorage.app`,
    };
  } catch {
    return null;
  }
}

export function loadFirebaseCredentials(env: NodeJS.ProcessEnv): FirebaseAdminCredentials {
  const jsonBlob = env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonBlob) {
    const fromJson = fromServiceAccountJson(jsonBlob);
    if (fromJson) {
      return {
        ...fromJson,
        storageBucket: env.FIREBASE_STORAGE_BUCKET?.trim() || fromJson.storageBucket,
      };
    }
  }

  return {
    projectId: env.FIREBASE_PROJECT_ID?.trim() ?? '',
    clientEmail: env.FIREBASE_CLIENT_EMAIL?.trim() ?? '',
    privateKey: parsePrivateKey(env.FIREBASE_PRIVATE_KEY ?? ''),
    storageBucket: env.FIREBASE_STORAGE_BUCKET?.trim() ?? '',
  };
}

export function validateFirebaseCredentials(creds: FirebaseAdminCredentials): string[] {
  const issues: string[] = [];

  if (!creds.projectId) issues.push('FIREBASE_PROJECT_ID is missing');
  if (!creds.clientEmail) issues.push('FIREBASE_CLIENT_EMAIL is missing');
  if (!creds.privateKey) issues.push('FIREBASE_PRIVATE_KEY is missing');

  if (creds.privateKey && !creds.privateKey.includes('BEGIN PRIVATE KEY')) {
    issues.push('FIREBASE_PRIVATE_KEY does not look like a PEM key (check \\n escaping on Render)');
  }

  return issues;
}
