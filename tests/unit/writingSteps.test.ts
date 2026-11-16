import { describe, expect, it } from 'vitest';
import en from '../../locales/en';
import nl from '../../locales/nl';
import { WRITING_STEP_SECONDS, writingProgress, writingStepIndex } from '../../utils/writingSteps';

describe('writing steps while the poem is written', () => {
  it('has one text per step in both languages', () => {
    for (const locale of [nl, en]) {
      expect(locale.poem.writing.steps).toHaveLength(WRITING_STEP_SECONDS.new.length);
      expect(locale.poem.writing.rewriteSteps).toHaveLength(WRITING_STEP_SECONDS.rewrite.length);
    }
  });

  it('starts at the first step and stays on the last one', () => {
    expect(writingStepIndex('new', 0)).toBe(0);
    expect(writingStepIndex('new', 4.9)).toBe(0);
    expect(writingStepIndex('new', 5)).toBe(1);
    expect(writingStepIndex('new', 600)).toBe(WRITING_STEP_SECONDS.new.length - 1);
    expect(writingStepIndex('rewrite', 20)).toBe(2);
  });

  it('never shows the bar as full before the poem is there', () => {
    expect(writingProgress('new', 0)).toBe(0);
    expect(writingProgress('new', 30)).toBeGreaterThan(0.8);
    expect(writingProgress('new', 30)).toBeLessThan(0.9);
    expect(writingProgress('new', 3600)).toBeLessThanOrEqual(0.95);
    expect(writingProgress('rewrite', 30)).toBeLessThan(writingProgress('new', 30));
  });
});
