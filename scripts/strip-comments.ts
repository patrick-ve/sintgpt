/**
 * Removes every comment from the build output before a deploy, then checks
 * that none is left. Runs after `nuxt build` in `npm run build:cloudflare`.
 *
 *   tsx scripts/strip-comments.ts .output
 *
 * JavaScript is parsed with acorn, so text that only looks like a comment
 * (inside a string, a template or a regular expression) stays. CSS is scanned
 * with a small tokenizer that skips strings. HTML keeps Vue's hydration
 * markers (<!--[-->, <!--]--> and <!---->), which the page needs.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, type Comment } from 'acorn';

/**
 * Vue's markers for fragments, empty slots and a v-if that renders nothing.
 * They are DOM nodes that hydration matches, so they must stay.
 */
export const VUE_MARKER = /^<!--(\[|\]|v-if|)-->$/;

export function findJsComments(source: string): Comment[] {
  const comments: Comment[] = [];
  parse(source, {
    ecmaVersion: 'latest',
    sourceType: 'module',
    allowHashBang: true,
    onComment: comments,
  });
  // Acorn reports a hashbang line as a comment. It is not one, and a script
  // without it no longer runs.
  return comments.filter(c => !(c.start === 0 && source.startsWith('#!')));
}

export function stripJsComments(source: string): string {
  const comments = findJsComments(source);
  let result = '';
  let position = 0;
  for (const comment of comments) {
    const text = source.slice(comment.start, comment.end);
    result += source.slice(position, comment.start);
    // Keep a line break where the comment had one, so automatic semicolon
    // insertion still sees it, and a space so two tokens never join.
    result += /[\n\r\u2028\u2029]/.test(text) ? '\n' : ' ';
    position = comment.end;
  }
  return result + source.slice(position);
}

/** [start, end) of each /* … *\/ comment outside CSS strings. */
function cssCommentRanges(source: string): Array<[number, number]> {
  const ranges: Array<[number, number]> = [];
  let i = 0;
  while (i < source.length) {
    const char = source[i];
    if (char === '"' || char === "'") {
      i++;
      while (i < source.length && source[i] !== char) {
        i += source[i] === '\\' ? 2 : 1;
      }
      i++;
    } else if (char === '/' && source[i + 1] === '*') {
      const end = source.indexOf('*/', i + 2);
      const stop = end === -1 ? source.length : end + 2;
      ranges.push([i, stop]);
      i = stop;
    } else {
      i++;
    }
  }
  return ranges;
}

export function findCssComments(source: string): string[] {
  return cssCommentRanges(source).map(([start, end]) => source.slice(start, end));
}

export function stripCssComments(source: string): string {
  let result = '';
  let position = 0;
  for (const [start, end] of cssCommentRanges(source)) {
    result += source.slice(position, start);
    position = end;
  }
  return result + source.slice(position);
}

export function findHtmlComments(source: string): string[] {
  return (source.match(/<!--[\s\S]*?-->/g) ?? []).filter(c => !VUE_MARKER.test(c));
}

export function stripHtmlComments(source: string): string {
  return source.replace(/<!--[\s\S]*?-->/g, c => (VUE_MARKER.test(c) ? c : ''));
}

const handlers: Record<string, { strip: (s: string) => string; find: (s: string) => unknown[] }> = {
  '.js': { strip: stripJsComments, find: findJsComments },
  '.mjs': { strip: stripJsComments, find: findJsComments },
  '.css': { strip: stripCssComments, find: findCssComments },
  '.html': { strip: stripHtmlComments, find: findHtmlComments },
};

export function stripOutput(dir: string): { files: number; changed: number; left: string[] } {
  const files = fs.readdirSync(dir, { recursive: true, withFileTypes: true })
    .filter(entry => entry.isFile() && handlers[path.extname(entry.name)])
    .map(entry => path.join(entry.parentPath, entry.name));

  let changed = 0;
  const left: string[] = [];
  for (const file of files) {
    const handler = handlers[path.extname(file)]!;
    const source = fs.readFileSync(file, 'utf8');
    const stripped = handler.strip(source);
    if (stripped !== source) {
      fs.writeFileSync(file, stripped);
      changed++;
    }
    if (handler.find(stripped).length) left.push(path.relative(dir, file));
  }
  return { files: files.length, changed, left };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const dir = process.argv[2];
  if (!dir || !fs.existsSync(dir)) {
    console.error('usage: tsx scripts/strip-comments.ts <build output dir>');
    process.exit(2);
  }
  const { files, changed, left } = stripOutput(dir);
  console.log(`strip-comments: ${files} files checked, ${changed} changed, ${left.length} with comments left`);
  if (left.length) {
    for (const file of left) console.error(`  comments left in ${file}`);
    process.exit(1);
  }
}
