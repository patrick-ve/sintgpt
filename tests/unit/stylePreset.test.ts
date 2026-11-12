import { describe, expect, it } from 'vitest';
import { STYLE_PRESETS, styleFromQuery } from '../../utils/stylePreset';

describe('styleFromQuery', () => {
  it('maps the Dutch style names to the form styles', () => {
    expect(styleFromQuery('grappig')).toBe('funny');
    expect(styleFromQuery('klassiek')).toBe('classic');
    expect(styleFromQuery('ironisch')).toBe('ironic');
    expect(styleFromQuery('ouderwets')).toBe('old-fashioned');
    expect(styleFromQuery('pikant')).toBe('spicy');
    expect(styleFromQuery('Roast')).toBe('roast');
    expect(Object.keys(STYLE_PRESETS)).toHaveLength(6);
  });

  it('ignores missing, repeated and unknown values', () => {
    expect(styleFromQuery(undefined)).toBeNull();
    expect(styleFromQuery(['roast', 'pikant'])).toBeNull();
    expect(styleFromQuery('funny')).toBeNull();
    expect(styleFromQuery('constructor')).toBeNull();
    expect(styleFromQuery('')).toBeNull();
  });
});
