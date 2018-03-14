import ensureArray from '../ensureArray';

describe('ensureArray.js', () => {
  it('wraps its parameter in an array', () => {
    expect(ensureArray('foo')).toEqual(['foo']);
    expect(ensureArray(1)).toEqual([1]);
  });

  it('returns its parameter when it\'s already an array', () => {
    const arr = [1, 2, 3];
    expect(ensureArray(arr)).toBe(arr);
  });
});
