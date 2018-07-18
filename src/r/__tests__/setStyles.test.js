import setStyles from '../setStyles';
import Listener from '../../listen/Listener';

describe('setStyles.js', () => {
  it('when styles is a string, its sets element.style to it', () => {
    const element = document.createElement('h1');
    const result = setStyles({
      html: [element],
    }, 'color: green;', {});
    expect(result).toBeInstanceOf(window.CSSStyleDeclaration);
    expect(element.style.color).toBe('green');
  });

  it('copies the styles to element when styles is an object', () => {
    const element = document.createElement('h1');
    const result = setStyles({
      html: [element],
    }, { color: 'green', width: 400 });
    expect(result).toBeInstanceOf(window.CSSStyleDeclaration);
    expect(element.style.color).toBe('green');
    expect(element.style.width).toBe('400px');
  });

  it("doesn't do anything when styles is an invalid type", () => {
    const element = document.createElement('h1');
    const result = setStyles({
      html: [element],
    }, ['color', 'green']);
    expect(result).toBeInstanceOf(window.CSSStyleDeclaration);
    expect(element.style.color).not.toBe('green');
  });

  it('handles listeners correctly', () => {
    const element = document.createElement('h1');
    const listener = new Listener({ state: { foo: { color: 'green' } }, addListener: () => {} }, 'foo');
    const result = setStyles({
      html: [element],
      $styleListeners: [],
    }, listener);
    expect(result).toBeInstanceOf(window.CSSStyleDeclaration);
    expect(element.style.color).toBe('green');
  });
});
