/**
 * Keeps the hashed client files of earlier builds in the deploy, so a page
 * that was opened before a deploy can still load its own lazy chunks.
 * Runs after `nuxt build` and `strip-comments` in `npm run build:cloudflare`.
 *
 *   tsx scripts/keep-old-assets.ts .output
 *
 * Workers Assets serves only the files of the newest deploy. A page opened
 * before that deploy asks for the chunk names of its own build, for example
 * pdf-lib when the visitor saves a PDF; without this script that request gets
 * a 404 and the PDF fails. The script copies the files of the current build
 * into `.cache/old-assets/_nuxt` (git-ignored) and copies back every cached
 * file the new build does not have. Files that no build used for 14 days are
 * removed from the cache. `_nuxt/builds/` (the build manifest) always comes
 * from the new build only. The cached files were cleaned by strip-comments in
 * their own build, and Cloudflare uploads only files it does not have yet.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KEEP_DAYS = 14;
const SKIP_DIR = 'builds';

/** Every file below `dir`, as a path relative to it, without `builds/`. */
export function listFiles(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    const relative = path.relative(base, full);
    if (entry.isDirectory()) {
      if (relative === SKIP_DIR) continue;
      files.push(...listFiles(full, base));
    } else if (entry.isFile()) {
      files.push(relative);
    }
  }
  return files;
}

export interface KeepResult {
  restored: number;
  cached: number;
  pruned: number;
}

export function keepOldAssets(buildAssets: string, cacheAssets: string, now = Date.now()): KeepResult {
  const maxAge = KEEP_DAYS * 24 * 60 * 60 * 1000;
  const current = new Set(listFiles(buildAssets));
  let restored = 0;
  let pruned = 0;

  // 1. Remove what no build used for 14 days, then copy the rest back.
  for (const file of listFiles(cacheAssets)) {
    const cachedPath = path.join(cacheAssets, file);
    if (now - fs.statSync(cachedPath).mtimeMs > maxAge) {
      fs.rmSync(cachedPath);
      pruned++;
      continue;
    }
    if (current.has(file)) continue;
    const target = path.join(buildAssets, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(cachedPath, target);
    restored++;
  }

  // 2. The files of this build start (or restart) their 14 days now.
  for (const file of current) {
    const cachedPath = path.join(cacheAssets, file);
    fs.mkdirSync(path.dirname(cachedPath), { recursive: true });
    fs.copyFileSync(path.join(buildAssets, file), cachedPath);
    const time = new Date(now);
    fs.utimesSync(cachedPath, time, time);
  }

  return { restored, cached: current.size, pruned };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const output = process.argv[2] ?? '.output';
  const buildAssets = path.join(output, 'public', '_nuxt');
  if (!fs.existsSync(buildAssets)) {
    console.error(`keep-old-assets: ${buildAssets} does not exist; run the build first`);
    process.exit(1);
  }
  const result = keepOldAssets(buildAssets, path.join('.cache', 'old-assets', '_nuxt'));
  console.log(
    `keep-old-assets: ${result.cached} files of this build cached, `
    + `${result.restored} from earlier builds kept, ${result.pruned} older than ${KEEP_DAYS} days removed`,
  );
}
