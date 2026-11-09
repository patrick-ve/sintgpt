// Writes the example poems shown on the home page and /voorbeelden, with the
// same prompt and settings as /api/poem/generate. The people are made up.
//
//   npx tsx --env-file=.env scripts/generate-example-poems.ts <out.json> [id ...]
//
// Review the output by hand, then copy the poems you keep into
// utils/examplePoems.ts. Costs a few cents.
import { writeFileSync } from 'node:fs';
import { createGateway, generateText } from 'ai';
import {
  buildPrompt,
  DEFAULT_POEM_MODEL,
  FALLBACK_POEM_MODEL,
  PoemRequestSchema,
  type PoemRequest,
} from '../server/utils/poem';
import { EXAMPLE_POEMS } from '../utils/examplePoems';

const [out, ...ids] = process.argv.slice(2);
if (!out) throw new Error('Usage: generate-example-poems.ts <out.json> [id ...]');

const apiKey = process.env.NUXT_AI_GATEWAY_API_KEY || process.env.AI_GATEWAY_API_KEY;
if (!apiKey) throw new Error('No AI Gateway key in the environment');
const gateway = createGateway({ apiKey });

const results = [];
for (const input of EXAMPLE_POEMS.filter(i => !ids.length || ids.includes(i.id))) {
  const request: PoemRequest = PoemRequestSchema.parse(input.request);
  const { text } = await generateText({
    model: gateway(DEFAULT_POEM_MODEL),
    prompt: buildPrompt(request),
    temperature: 1,
    maxRetries: 3,
    providerOptions: { gateway: { models: [FALLBACK_POEM_MODEL] } },
  });
  console.log(`${input.id}: ${text.split('\n').length} lines`);
  results.push({ id: input.id, poem: text.trim() });
}

writeFileSync(out, JSON.stringify(results, null, 2));
