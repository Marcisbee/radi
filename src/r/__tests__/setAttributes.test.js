import setAttributes from '../setAttributes';
import Listener from '../../listen/Listener';

describe('setAttributes.js', () => {
  it('correctly adds attributes', () => {
    const element = document.createElement('h1');
    setAttributes({
      html: [element],
    }, {
      foo: 'bar',
      bar: 'foo',
      fooBar: 'caseSensitive',
    });
    expect(element.getAttribute('foo')).toBe('bar');
    expect(element.getAttribute('bar')).toBe('foo');
    expect(element.getAttribute('fooBar')).toBe('caseSensitive');
  });

  it('ignores empty attributes', () => {
    const element = document.createElement('h1');
    setAttributes({
      html: [element],
    }, {
      foo: undefined,
      bar: null,
      baz: 0,
    });
    expect(element.getAttribute('foo')).toBeNull();
    expect(element.getAttribute('bar')).toBeNull();
    expect(element.getAttribute('baz')).toBe("0");
  });

  it('calls setStyles to set styles', () => {
    const element = document.createElement('h1');
    setAttributes({
      html: [element],
    }, { style: { color: 'green' } });
    expect(element.style.color).toBe('green');
  });

  it('handles listeners correctly', () => {
    const element = document.createElement('h1');
    const listener = new Listener({ state: { foo: 'bar' }, addListener: () => {} }, 'foo');
    setAttributes({
      html: [element],
      $attrListeners: [],
    }, { baz: listener });
    expect(element.getAttribute('baz')).toBe('bar');
  });
});
