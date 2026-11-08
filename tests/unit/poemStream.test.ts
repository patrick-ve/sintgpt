import { describe, expect, it } from 'vitest';
import { parseStreamLine, readPoemStream } from '../../utils/poemStream';

function streamOf(...chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

const sse = (data: unknown) => `data: ${JSON.stringify(data)}\n\n`;

describe('parseStreamLine', () => {
  it('returns text deltas', () => {
    expect(parseStreamLine(sse({ type: 'text-delta', id: '0', delta: 'Hoi' }).trim()))
      .toEqual({ type: 'text-delta', delta: 'Hoi' });
  });

  it('ignores other events, [DONE] and non-data lines', () => {
    expect(parseStreamLine('data: {"type":"start"}')).toBeNull();
    expect(parseStreamLine('data: {"type":"reasoning-delta","delta":"x"}')).toBeNull();
    expect(parseStreamLine('data: [DONE]')).toBeNull();
    expect(parseStreamLine('')).toBeNull();
    expect(parseStreamLine(': keep-alive')).toBeNull();
  });

  it('reports error events', () => {
    expect(parseStreamLine('data: {"type":"error","errorText":"no credit"}'))
      .toEqual({ type: 'error', errorText: 'no credit' });
  });
});

describe('readPoemStream', () => {
  it('joins deltas, also when a line is split across chunks', async () => {
    const full
      = sse({ type: 'start' })
      + sse({ type: 'text-delta', id: '0', delta: 'Sint en ' })
      + sse({ type: 'text-delta', id: '0', delta: 'Piet' })
      + 'data: [DONE]\n\n';
    const cut = full.indexOf('Piet');

    let poem = '';
    await readPoemStream(streamOf(full.slice(0, cut), full.slice(cut)), (d) => {
      poem += d;
    });
    expect(poem).toBe('Sint en Piet');
  });

  it('throws when the stream contains an error event', async () => {
    const body = streamOf(
      sse({ type: 'text-delta', id: '0', delta: 'Sint' }),
      sse({ type: 'error', errorText: 'Insufficient funds' }),
    );
    await expect(readPoemStream(body, () => {})).rejects.toThrow('Insufficient funds');
  });
});
