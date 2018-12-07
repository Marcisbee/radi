import types from '../types';

describe('types.js', () => {
  it('exports constants', () => {
    expect(types.NODE).toBe(0);
    expect(types.TEXT).toBe(1);
    expect(types.COMPONENT).toBe(2);
  });
});
