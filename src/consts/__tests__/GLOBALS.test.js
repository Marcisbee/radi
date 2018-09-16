import GLOBALS from '../GLOBALS';

describe('GLOBALS.js', () => {
  it('exports constants', () => {
    expect(typeof GLOBALS.SERVICES).toBe('object');
    expect(typeof GLOBALS.VERSION).toBe('string');
    expect(typeof GLOBALS.CUSTOM_ATTRIBUTES).toBe('object');
    expect(typeof GLOBALS.CUSTOM_TAGS).toBe('object');
  });
});
