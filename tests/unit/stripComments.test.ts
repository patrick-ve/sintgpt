import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findCssComments,
  findHtmlComments,
  findJsComments,
  stripCssComments,
  stripHtmlComments,
  stripJsComments,
  stripOutput,
} from '../../scripts/strip-comments';

// Runs the code and returns what it exports as `result`.
function run(source: string): unknown {
  return new Function(`${source}\nreturn result;`)();
}

describe('stripJsComments', () => {
  it('removes line, block and license comments', () => {
    const source = '/*! MIT */\n// note\nconst a = 1; /* why */ const b = 2;\n//# sourceMappingURL=x.map';
    const stripped = stripJsComments(source);
    expect(findJsComments(stripped)).toEqual([]);
    expect(stripped).not.toMatch(/MIT|note|why|sourceMappingURL/);
  });

  it('keeps text that only looks like a comment', () => {
    const source = [
      'const url = "https://sintgpt.com/*";',
      "const glob = '/* not a comment */';",
      'const tpl = `// also not ${1 + 1}`;',
      'const re = /\\/\\*/g;',
      'var result = [url, glob, tpl, re.source];',
    ].join('\n');
    expect(stripJsComments(source)).toBe(source);
    expect(run(stripJsComments(source))).toEqual([
      'https://sintgpt.com/*',
      '/* not a comment */',
      '// also not 2',
      '\\/\\*',
    ]);
  });

  it('never joins two tokens', () => {
    expect(run(stripJsComments('var a = 1; var result = typeof/**/a;'))).toBe('number');
    expect(run(stripJsComments('var result = 2/**/-/**/-1;'))).toBe(3);
  });

  it('keeps the line break that automatic semicolon insertion needs', () => {
    const source = 'var result = (function () { return /*\n*/ 1; })();';
    // `return` followed by a line break returns undefined, with or without the comment.
    expect(run(source)).toBeUndefined();
    expect(run(stripJsComments(source))).toBeUndefined();
  });

  it('keeps a hashbang', () => {
    expect(stripJsComments('#!/usr/bin/env node\nconst a = 1; // x')).toBe('#!/usr/bin/env node\nconst a = 1;  ');
  });
});

describe('stripCssComments', () => {
  it('removes comments, including the license banner', () => {
    const css = '/*! tailwindcss v4 | MIT License */.a{color:red}/* x */.b{margin:0}';
    expect(stripCssComments(css)).toBe('.a{color:red}.b{margin:0}');
    expect(findCssComments(stripCssComments(css))).toEqual([]);
  });

  it('keeps comment-like text in strings', () => {
    const css = `.a::before{content:"/* hi */"}.b{background:url('a/*b.png')}`;
    expect(stripCssComments(css)).toBe(css);
  });

  it('handles escaped quotes and an unclosed comment', () => {
    expect(stripCssComments('.a{content:"\\"/*"}/* open')).toBe('.a{content:"\\"/*"}');
  });
});

describe('stripHtmlComments', () => {
  it('removes comments but keeps the markers Vue needs for hydration', () => {
    const html = '<div><!--[--><p>a</p><!--]--><!----><!-- secret --></div>';
    expect(stripHtmlComments(html)).toBe('<div><!--[--><p>a</p><!--]--><!----></div>');
    expect(stripHtmlComments('<!--v-if-->')).toBe('<!--v-if-->');
    expect(findHtmlComments(html)).toEqual(['<!-- secret -->']);
  });
});

describe('stripOutput', () => {
  it('cleans every file type and reports nothing left', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-'));
    fs.mkdirSync(path.join(dir, 'server'));
    fs.writeFileSync(path.join(dir, 'server/index.mjs'), 'export default 1; // x');
    fs.writeFileSync(path.join(dir, 'a.css'), '/*! x */.a{}');
    fs.writeFileSync(path.join(dir, 'a.html'), '<p><!-- x -->a</p>');
    fs.writeFileSync(path.join(dir, 'notes.txt'), '// stays');

    expect(stripOutput(dir)).toEqual({ files: 3, changed: 3, left: [] });
    expect(fs.readFileSync(path.join(dir, 'notes.txt'), 'utf8')).toBe('// stays');
    // A second run finds nothing to do.
    expect(stripOutput(dir)).toEqual({ files: 3, changed: 0, left: [] });
    fs.rmSync(dir, { recursive: true });
  });

  it('fails loudly on JavaScript it cannot parse, instead of shipping comments', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'strip-'));
    fs.writeFileSync(path.join(dir, 'broken.js'), 'const = ; // x');
    expect(() => stripOutput(dir)).toThrow();
    fs.rmSync(dir, { recursive: true });
  });
});
