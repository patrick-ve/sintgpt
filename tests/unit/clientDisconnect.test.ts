import { EventEmitter } from 'node:events';
import type { H3Event } from 'h3';
import { describe, expect, it } from 'vitest';
import { clientDisconnectSignal } from '../../server/utils/clientDisconnect';

function nodeEvent() {
  const res = Object.assign(new EventEmitter(), { writableFinished: false });
  return { res, event: { context: {}, node: { res } } as unknown as H3Event };
}

describe('clientDisconnectSignal', () => {
  it('uses the request signal on Cloudflare Workers', () => {
    const controller = new AbortController();
    const event = {
      context: { cloudflare: { request: { signal: controller.signal } } },
    } as unknown as H3Event;
    expect(clientDisconnectSignal(event)).toBe(controller.signal);
  });

  it('aborts when the visitor leaves before the response is done', () => {
    const { res, event } = nodeEvent();
    const signal = clientDisconnectSignal(event);
    expect(signal.aborted).toBe(false);
    res.emit('close');
    expect(signal.aborted).toBe(true);
  });

  it('does not abort when the response finished normally', () => {
    const { res, event } = nodeEvent();
    const signal = clientDisconnectSignal(event);
    res.writableFinished = true;
    res.emit('close');
    expect(signal.aborted).toBe(false);
  });

  it('returns a signal that never fires when there is no response', () => {
    const signal = clientDisconnectSignal({ context: {} } as unknown as H3Event);
    expect(signal.aborted).toBe(false);
  });
});
