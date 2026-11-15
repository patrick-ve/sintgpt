import { describe, expect, it } from 'vitest';
import {
  framePoem,
  framePoemStream,
  greetingName,
  isGreetingLine,
  isSignatureLine,
  poemFrame,
  unframePoem,
} from '../../utils/poemFrame';
import { poemDigest } from '../../utils/poemLink';

describe('poemFrame', () => {
  it('greets in the language of the poem and signs as Sint and Piet', () => {
    expect(poemFrame('Patrick', 'dutch')).toEqual({ greeting: 'Lieve Patrick,', signature: 'Van Sint & Piet' });
    expect(poemFrame('  Oma &  Opa ', 'english')).toEqual({ greeting: 'Dear Oma & Opa,', signature: 'From Sinterklaas & Pete' });
  });

  it('greets only names, because the greeting is signed text on sintgpt.com', () => {
    for (const name of ['Jan-Willem', "d'Artagnan", 'J. de Vries', 'Zoë', 'Mr. Smith', 'Søren']) {
      expect(greetingName(name)).toBe(name);
    }
    for (const name of ['', '   ', 'evil.com', 'kijk op www.x.nl', 'Bel 0612345678', 'Sanne <3', 'a'.repeat(41)]) {
      expect(greetingName(name)).toBeNull();
    }
    expect(poemFrame('evil.com', 'dutch')).toEqual({ greeting: null, signature: 'Van Sint & Piet' });
  });
});

describe('framePoem and unframePoem', () => {
  const frame = poemFrame('Sanne', 'dutch');
  const poem = 'Sanne fietst elke dag,\nZo hard als zij maar mag.';

  it('puts the greeting above and the signature below, each as its own stanza', () => {
    expect(framePoem(`\n${poem}\n`, frame)).toBe(`Lieve Sanne,\n\n${poem}\n\nVan Sint & Piet`);
    expect(framePoem(poem, { greeting: null, signature: 'Van Sint & Piet' })).toBe(`${poem}\n\nVan Sint & Piet`);
  });

  it('takes them off again, and leaves a poem without them alone', () => {
    expect(unframePoem(framePoem(poem, frame), frame)).toBe(poem);
    expect(unframePoem(poem, frame)).toBe(poem);
    // A greeting for someone else is part of that poem.
    expect(unframePoem(`Lieve Piet,\n\n${poem}`, frame)).toBe(`Lieve Piet,\n\n${poem}`);
  });

  it('knows the greeting line', () => {
    expect(isGreetingLine('Lieve Sanne,')).toBe(true);
    expect(isGreetingLine(' Dear Oma & Opa, ')).toBe(true);
    expect(isGreetingLine('Lieve Sanne, wat ben je toch fijn,')).toBe(false);
    expect(isGreetingLine('Beste Sanne,')).toBe(false);
    expect(isGreetingLine('Lieve evil.com,')).toBe(false);
  });

  it('knows the signature line', () => {
    expect(isSignatureLine('Van Sint & Piet')).toBe(true);
    expect(isSignatureLine(' From Sinterklaas & Pete ')).toBe(true);
    expect(isSignatureLine('Van Sint en Piet, met liefde')).toBe(false);
  });
});

type Part = { type: string; id?: string; text?: string };

async function run(parts: Part[], frame = poemFrame('Sanne', 'dutch')) {
  const out: Part[] = [];
  const stream = new ReadableStream<Part>({
    start(controller) {
      for (const part of parts) controller.enqueue(part);
      controller.close();
    },
  }).pipeThrough(framePoemStream<Part>(frame));
  for await (const part of stream as unknown as AsyncIterable<Part>) out.push(part);
  const text = out.filter(part => part.type === 'text-delta').map(part => part.text).join('');
  return { out, text };
}

const delta = (text: string, id = 't1'): Part => ({ type: 'text-delta', id, text });

describe('framePoemStream', () => {
  it('sends exactly the text the server signs', async () => {
    const model = ['\n', 'Sanne fietst ', 'elke dag,\n', 'Zo hard als ', 'zij maar mag.', '\n\n'];
    const { text } = await run([
      { type: 'start' },
      { type: 'reasoning-delta', id: 'r', text: 'denken' },
      { type: 'text-start', id: 't1' },
      ...model.map(part => delta(part)),
      { type: 'text-end', id: 't1' },
      { type: 'finish-step' },
      { type: 'finish' },
    ]);
    const frame = poemFrame('Sanne', 'dutch');
    expect(text).toBe(framePoem(model.join(''), frame));
    expect(await poemDigest(text)).toBe(await poemDigest(framePoem(model.join('').trim(), frame)));
  });

  it('sends the greeting with the first text, not before it', async () => {
    const { out } = await run([{ type: 'reasoning-delta', id: 'r', text: 'x' }, delta('  '), delta('Sanne'), { type: 'finish-step' }]);
    expect(out.map(part => part.type)).toEqual(['reasoning-delta', 'text-delta', 'text-delta', 'finish-step']);
    expect(out[1]!.text).toBe('Lieve Sanne,\n\nSanne');
  });

  it('signs once, before the text ends, and keeps whitespace inside the poem', async () => {
    const { out, text } = await run([
      delta('Regel een,\n\n'), delta('Regel twee.\n'), { type: 'text-end', id: 't1' }, { type: 'finish-step' }, { type: 'finish' },
    ]);
    expect(text).toBe('Lieve Sanne,\n\nRegel een,\n\nRegel twee.\n\nVan Sint & Piet');
    const types = out.map(part => part.type);
    expect(types.indexOf('text-end')).toBeGreaterThan(types.lastIndexOf('text-delta'));
  });

  it('adds nothing when no text came (an error or an abort)', async () => {
    const { text, out } = await run([{ type: 'error' }, { type: 'finish-step' }, { type: 'finish' }]);
    expect(text).toBe('');
    expect(out.map(part => part.type)).toEqual(['error', 'finish-step', 'finish']);
  });

  it('signs without a greeting when the name is not a plain name', async () => {
    const { text } = await run([delta('Een gedicht.'), { type: 'finish' }], poemFrame('evil.com', 'dutch'));
    expect(text).toBe('Een gedicht.\n\nVan Sint & Piet');
  });
});
