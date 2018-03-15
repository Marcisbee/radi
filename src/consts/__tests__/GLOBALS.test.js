import GLOBALS from '../GLOBALS';

describe('GLOBALS.js', () => {
  it('exports constants', () => {
    expect(typeof GLOBALS.MIX).toBe('object');
    expect(typeof GLOBALS.FROZEN_STATE).toBe('boolean');
    expect(typeof GLOBALS.VERSION).toBe('string');
    expect(typeof GLOBALS.ACTIVE_COMPONENTS).toBe('object');
    expect(typeof GLOBALS.HTML_CACHE).toBe('object');
  });
});
