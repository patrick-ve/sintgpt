import { describe, expect, it } from 'vitest';
import { internalParam, isInternalCookie } from '../../utils/internalTraffic';

describe('internal traffic', () => {
  it('finds the cookie among others, and only with the value 1', () => {
    expect(isInternalCookie('sintgpt-intern=1')).toBe(true);
    expect(isInternalCookie('a=b; sintgpt-intern=1; c=d')).toBe(true);
    expect(isInternalCookie('sintgpt-intern=0')).toBe(false);
    expect(isInternalCookie('sintgpt-intern=10')).toBe(false);
    expect(isInternalCookie('xsintgpt-intern=1')).toBe(false);
    expect(isInternalCookie('')).toBe(false);
    expect(isInternalCookie(undefined)).toBe(false);
  });

  it('reads ?intern=1 and ?intern=0, and ignores anything else', () => {
    expect(internalParam('?intern=1')).toBe('on');
    expect(internalParam('?utm_source=x&intern=0')).toBe('off');
    expect(internalParam('?intern=yes')).toBeNull();
    expect(internalParam('')).toBeNull();
  });
});
