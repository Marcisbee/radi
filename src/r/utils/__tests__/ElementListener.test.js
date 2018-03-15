import sinon from 'sinon';
import ElementListener from '../ElementListener';

describe('ElementListener.js', () => {
  it('instantiates correctly', () => {
    const elementListener = new ElementListener({
      listener: { foo: 'bar' },
      element: { bar: 'foo' }
    });
    expect(elementListener.listener).toEqual({ foo: 'bar' });
    expect(elementListener.element).toEqual({ bar: 'foo' });
    expect(elementListener.attached).toBe(false);
  });

  it('attaches and updates correctly', () => {
    const appendChildSpy = sinon.spy();
    const options = {
      listener: {
        onValueChange: callback => {
          callback('bar');
        }
      },
      element: {
        appendChild: appendChildSpy
      }
    };
    const elementListener = new ElementListener(options);
    const result = elementListener.attach();
    expect(result).toBe(elementListener);
    expect(options.element.listeners[0]).toBe(elementListener);
    expect(appendChildSpy.calledOnce).toBe(true);
    expect(appendChildSpy.getCall(0).args[0]).toEqual(document.createTextNode('bar'));
  });

  it('updates its element correctly', () => {
    const elementListener = new ElementListener({
      listener: {},
      element: {}
    });
    elementListener.updateElement({ foo: 'bar' });
    expect(elementListener.element).toEqual({ foo: 'bar' });
  });
});
