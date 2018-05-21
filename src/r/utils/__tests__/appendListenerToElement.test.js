import ElementListener from '../ElementListener';
import appendListenerToElement from '../appendListenerToElement';

describe('appendListenerToElement.js', () => {
  it('it creates an instance of ElementListener and attaches it', () => {
    const fakeListener = {
      onValueChange: () => {},
    };
    const fakeElement = {
      appendChild: () => {},
      insertBefore: () => {},
    };
    const result = appendListenerToElement(fakeListener, fakeElement);
    expect(result).toBeInstanceOf(ElementListener);
    expect(result.attached).toBe(true);
  });
});
