import parseValue from '../parseValue';

describe('parseValue.js', () => {
  it('parses numbers to strings with px', () => {
    expect(parseValue(100)).toBe('100px');
  });

  it("doesn't parse NaN values", () => {
    expect(Number.isNaN(parseValue(NaN))).toBe(true);
  });

  it('returns its parameter when its not a number', () => {
    expect(parseValue('foo')).toBe('foo');
  });
});
