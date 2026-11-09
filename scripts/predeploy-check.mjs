// Run before every deploy (see .claude/skills/deploy/SKILL.md):
//
//   node scripts/predeploy-check.mjs [envPath=.env] [outputDir=.output]
//
// Fails if any value from .env (or .env.analytics) appears in the build output, if an env file was
// copied into it, or if .env holds a live Dodo key (that key belongs only in
// the Worker secrets). Prints only variable names and yes/no, never values.
import fs from 'node:fs';
import path from 'node:path';

const [envPath = '.env', outDir = '.output'] = process.argv.slice(2);
if (!envPath || !outDir) {
  console.error('usage: predeploy-check.mjs [envPath] [outputDir]');
  process.exit(2);
}

// The analytics token sits apart from the app secrets; it must never ship either.
const envFiles = [envPath, path.join(path.dirname(envPath), '.env.analytics')].filter(file => fs.existsSync(file));
const entries = envFiles.map(file => fs.readFileSync(file, 'utf8')).join('\n')
  .split('\n')
  .map(line => line.trim())
  .filter(line => line && !line.startsWith('#') && line.includes('='))
  .map((line) => {
    const i = line.indexOf('=');
    return [line.slice(0, i).trim(), line.slice(i + 1).trim().replace(/^['"]|['"]$/g, '')];
  })
  .filter(([, value]) => value.length >= 8);

let failed = false;
if (entries.some(([name, value]) => name === 'NUXT_DODO_PAYMENTS_API_KEY' && value.startsWith('dodo_live_'))) {
  console.log('live Dodo key in .env: yes  (FAIL)');
  failed = true;
}

const files = [];
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.isFile()) files.push(full);
  }
};
walk(outDir);

const leaked = new Set();
for (const file of files) {
  const content = fs.readFileSync(file);
  for (const [name, value] of entries) {
    if (content.includes(value)) leaked.add(`${name} in ${path.relative(outDir, file)}`);
  }
}
if (fs.existsSync(path.join(outDir, '.dev.vars')) || fs.existsSync(path.join(outDir, '.env'))) {
  leaked.add('env file copied into output');
}

for (const item of leaked) console.log(`leak: ${item}  (FAIL)`);
if (leaked.size) failed = true;
console.log(`checked ${entries.length} variable names from ${envFiles.map(file => path.basename(file)).join(', ')} against ${files.length} files: ${failed ? 'FAIL' : 'ok'}`);
process.exit(failed ? 1 : 0);
