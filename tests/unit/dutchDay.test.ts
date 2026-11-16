import { describe, expect, it } from 'vitest';
import { dutchDayStart, dutchTime, sqlTimestamp } from '../../scripts/dutchDay';

describe('dutchDayStart', () => {
  it('starts a winter day at 23:00 UTC the evening before', () => {
    expect(dutchDayStart(new Date('2026-11-16T13:47:00Z')).toISOString()).toBe('2026-11-15T23:00:00.000Z');
  });

  it('starts a summer day at 22:00 UTC the evening before', () => {
    expect(dutchDayStart(new Date('2026-07-01T12:00:00Z')).toISOString()).toBe('2026-06-30T22:00:00.000Z');
  });

  it('uses the Dutch date, not the UTC date, just after Dutch midnight', () => {
    expect(dutchDayStart(new Date('2026-11-15T23:30:00Z')).toISOString()).toBe('2026-11-15T23:00:00.000Z');
  });

  it('goes back whole Dutch days', () => {
    expect(dutchDayStart(new Date('2026-11-16T13:47:00Z'), 1).toISOString()).toBe('2026-11-14T23:00:00.000Z');
  });

  it('handles the nights the clocks change', () => {
    // 25 Oct 2026: 03:00 CEST becomes 02:00 CET. The day starts at 00:00 CEST.
    expect(dutchDayStart(new Date('2026-10-25T20:00:00Z')).toISOString()).toBe('2026-10-24T22:00:00.000Z');
    // 29 Mar 2026: 02:00 CET becomes 03:00 CEST. The day starts at 00:00 CET.
    expect(dutchDayStart(new Date('2026-03-29T20:00:00Z')).toISOString()).toBe('2026-03-28T23:00:00.000Z');
  });
});

describe('sqlTimestamp and dutchTime', () => {
  it('formats for Analytics Engine and for people', () => {
    const at = new Date('2026-11-15T23:00:00Z');
    expect(sqlTimestamp(at)).toBe('2026-11-15 23:00:00');
    expect(dutchTime(at)).toBe('00:00');
  });
});
