import sinon from 'sinon';
import ElementListener from '../ElementListener';

describe('ElementListener.js', () => {
  it('instantiates correctly', () => {
    const elementListener = new ElementListener({
      listener: { foo: 'bar' },
      element: { bar: 'foo' },
    });
    expect(elementListener.listener).toEqual({ foo: 'bar' });
    expect(elementListener.element).toEqual({ bar: 'foo' });
    expect(elementListener.attached).toBe(false);
  });

  it('attaches and updates correctly', () => {
    const options = {
      listener: {
        onValueChange: callback => {
          callback('bar');
        },
        applyDepth: () => options.listener,
        init: () => {},
      },
      element: document.createElement('div'),
      depth: 0,
    };
    const elementListener = new ElementListener(options);
    const result = elementListener.attach();
    expect(result).toBe(elementListener);
    expect(options.element.listeners[0]).toBe(elementListener);
    expect(options.element.innerHTML).toEqual('bar');
  });
});
