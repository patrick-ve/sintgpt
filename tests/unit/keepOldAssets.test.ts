import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { keepOldAssets, listFiles } from '../../scripts/keep-old-assets';

const DAY = 24 * 60 * 60 * 1000;

function tempDirs() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'keep-assets-'));
  return { build: path.join(root, 'build'), cache: path.join(root, 'cache') };
}

function write(dir: string, file: string, content = file) {
  fs.mkdirSync(path.dirname(path.join(dir, file)), { recursive: true });
  fs.writeFileSync(path.join(dir, file), content);
}

describe('keepOldAssets', () => {
  it('keeps the chunks of the previous build in the next deploy', () => {
    const { build, cache } = tempDirs();
    write(build, 'old-pdf.js');
    write(build, 'entry.css');
    keepOldAssets(build, cache);

    // The next build has a new name for the PDF chunk.
    fs.rmSync(build, { recursive: true });
    write(build, 'new-pdf.js');
    write(build, 'entry.css', 'new css');
    const result = keepOldAssets(build, cache);

    expect(listFiles(build).sort()).toEqual(['entry.css', 'new-pdf.js', 'old-pdf.js']);
    // A file both builds have comes from the new build.
    expect(fs.readFileSync(path.join(build, 'entry.css'), 'utf8')).toBe('new css');
    expect(result).toEqual({ restored: 1, cached: 2, pruned: 0 });
  });

  it('never copies the build manifest from an earlier build', () => {
    const { build, cache } = tempDirs();
    write(build, 'builds/latest.json', 'old');
    write(build, 'a.js');
    keepOldAssets(build, cache);
    expect(fs.existsSync(path.join(cache, 'builds'))).toBe(false);
  });

  it('drops files that no build used for 14 days', () => {
    const { build, cache } = tempDirs();
    const start = Date.now();
    write(build, 'old.js');
    keepOldAssets(build, cache, start - 15 * DAY);
    fs.rmSync(build, { recursive: true });
    write(build, 'new.js');

    const result = keepOldAssets(build, cache, start);

    expect(listFiles(build)).toEqual(['new.js']);
    expect(listFiles(cache)).toEqual(['new.js']);
    expect(result.pruned).toBe(1);
  });
});
