import clone from '../clone';

describe('clone.js', () => {
  it('returns null when object to clone is null', () => {
    expect(clone(null)).toBeNull();
  });

  it("returns its parameter when it's not an object", () => {
    expect(clone('foo')).toBe('foo');
    expect(clone(7)).toBe(7);
  });

  it('clones arrays correctly', () => {
    const arr = [1, 2, 3, 4, 5];
    expect(clone(arr)).toEqual([1, 2, 3, 4, 5]);
    expect(clone(arr) === arr).toBe(false);
  });

  it('clones objects correctly', () => {
    const obj = { foo: 'bar', bar: 'foo' };
    expect(clone(obj)).toEqual({ foo: 'bar', bar: 'foo' });
    expect(clone(obj) === obj).toBe(false);
  });

  it('clones child objects', () => {
    const childObj = { a: 'b' };
    const arr = [1, 2, 3, 4, 5, childObj];
    const obj = { foo: 'bar', bar: 'foo', child: childObj };
    expect(clone(arr)[5]).toEqual(childObj);
    expect(clone(arr)[5] === childObj).toBe(false);
    expect(clone(obj).child).toEqual(childObj);
  });
});
