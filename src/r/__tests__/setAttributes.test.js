import setAttributes from '../setAttributes';
import Listener from '../../listen/Listener';

describe('setAttributes.js', () => {
  it('correctly adds attributes', () => {
    const element = document.createElement('h1');
    setAttributes(element, {
      foo: 'bar',
      bar: 'foo'
    });
    expect(element.getAttribute('foo')).toBe('bar');
    expect(element.getAttribute('bar')).toBe('foo');
  });

  it('ignores empty attributes', () => {
    const element = document.createElement('h1');
    setAttributes(element, {
      foo: undefined
    });
    expect(element.getAttribute('foo')).toBeNull();
  });

  it('calls setStyles to set styles', () => {
    const element = document.createElement('h1');
    setAttributes(element, { style: { color: 'green' } });
    expect(element.style.color).toBe('green');
  });

  it('handles listeners correctly', () => {
    const element = document.createElement('h1');
    const listener = new Listener(
      { foo: 'bar', addListener: () => {} },
      'foo'
    );
    setAttributes(element, { baz: listener });
    expect(element.getAttribute('baz')).toBe('bar');
  });
});
