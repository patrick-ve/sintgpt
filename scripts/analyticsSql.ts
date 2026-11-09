// Shared by the analytics report and dashboard: one SQL query against the
// Workers Analytics Engine dataset. The token needs only "Account Analytics Read".

import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

export const DATASET = 'sintgpt_events';

// The token may live in .env.analytics (git-ignored by `.env.*`), apart from the
// app secrets in .env:  CLOUDFLARE_ANALYTICS_TOKEN=...
const ENV_FILE = resolve(import.meta.dirname, '..', '.env.analytics');
if (existsSync(ENV_FILE)) process.loadEnvFile(ENV_FILE);

/** The SintGPT Cloudflare account. Not a secret; override with CLOUDFLARE_ACCOUNT_ID. */
const DEFAULT_ACCOUNT_ID = '8b2893f2640b94617462d93951ec6c4c';

export type Row = Record<string, unknown>;

export function analyticsCredentials(): { accountId: string; token: string } {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || DEFAULT_ACCOUNT_ID;
  const token = process.env.CLOUDFLARE_ANALYTICS_TOKEN;
  if (!token) {
    console.error('Set CLOUDFLARE_ANALYTICS_TOKEN (a Cloudflare API token with Account Analytics Read), for example in .env.analytics.');
    process.exit(1);
  }
  return { accountId, token };
}

export async function analyticsQuery(sql: string): Promise<Row[]> {
  const { accountId, token } = analyticsCredentials();
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/analytics_engine/sql`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: `${sql} FORMAT JSON` },
  );
  if (!res.ok) throw new Error(`${res.status}: ${(await res.text()).slice(0, 300)}`);
  return ((await res.json()) as { data: Row[] }).data;
}
