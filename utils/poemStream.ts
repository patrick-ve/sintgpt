/**
 * Reads an AI SDK UI message stream (SSE) and calls `onDelta` for every
 * text delta. Lines can arrive split across chunks, so incomplete lines
 * are buffered until the next chunk. Throws when the stream reports an
 * error (for example an AI Gateway auth or credit failure), because those
 * arrive with HTTP 200 and would otherwise produce an empty poem.
 */
export async function readPoemStream(
  body: ReadableStream<Uint8Array>,
  onDelta: (delta: string) => void,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  const handleLine = (line: string) => {
    const chunk = parseStreamLine(line);
    if (!chunk) return;
    if (chunk.type === 'error') throw new Error(chunk.errorText);
    onDelta(chunk.delta);
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';
    lines.forEach(handleLine);
  }

  buffer += decoder.decode();
  if (buffer) handleLine(buffer);
}

export type PoemStreamChunk =
  | { type: 'text-delta'; delta: string }
  | { type: 'error'; errorText: string };

/** Parses one SSE line. Returns null for lines the poem UI does not need. */
export function parseStreamLine(line: string): PoemStreamChunk | null {
  if (!line.startsWith('data: ')) return null;

  const json = line.substring(6);
  if (json === '[DONE]') return null;

  let parsed: any;
  try {
    parsed = JSON.parse(json);
  }
  catch (e) {
    console.error('Failed to parse stream data:', e);
    return null;
  }

  if (parsed.type === 'text-delta' && typeof parsed.delta === 'string') {
    return { type: 'text-delta', delta: parsed.delta };
  }
  if (parsed.type === 'error') {
    return {
      type: 'error',
      errorText: parsed.errorText || 'Failed to generate poem',
    };
  }
  return null;
}
