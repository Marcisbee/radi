import Watchable from '../Watchable';

// TODO: Test properly
describe('Watchable.js', () => {
  it('works', () => {
    const source = { __path: 'foo', bar: 'baz' };
    const watchable = new Watchable(source, 'bar', () => source);
    expect(watchable.path).toBe('foo.bar');
    expect(watchable.get()).toBe('baz');
    expect(watchable.source).toEqual({
      __path: 'foo',
      bar: 'baz'
    });
    expect(watchable.set('test')).toBe('test');
    expect(watchable.source).toEqual({
      __path: 'foo',
      bar: 'test'
    });
    expect(watchable.prop).toBe('bar');
    expect(watchable.parent()).toBe(source);
  });
});
