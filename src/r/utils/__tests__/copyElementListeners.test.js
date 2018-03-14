import sinon from 'sinon';
import copyElementListeners from '../copyElementListeners';

describe('copyElementListeners.js', () => {
  it('copies the attribute listeners correctly', () => {
    const oldElement = {
      listeners: [
        { updateElement: () => {} },
        { updateElement: () => {} },
        { updateElement: () => {} },
      ],
    };
    const newElement = {};
    const result = copyElementListeners(oldElement, newElement);
    expect(result).toBe(newElement);
    expect(newElement.listeners).toBe(oldElement.listeners);
  });

  it('doesn\'t do anything when given oldElement doesn\'t have any listeners', () => {
    const oldElement = {};
    const newElement = {};
    const result = copyElementListeners(oldElement, newElement);
    expect(result).toBe(newElement);
    expect(newElement.listeners).toBeUndefined();
  });

  it('calls the updateElement method on all listeners', () => {
    const updateElementSpy = sinon.spy();
    const oldElement = {
      listeners: [
        { updateElement: updateElementSpy },
        { updateElement: updateElementSpy },
        { updateElement: updateElementSpy },
      ],
    };
    const newElement = { foo: 'bar' };
    copyElementListeners(oldElement, newElement);
    expect(updateElementSpy.callCount).toBe(3);
    expect(updateElementSpy.getCall(0).args[0]).toBe(newElement);
    expect(updateElementSpy.getCall(1).args[0]).toBe(newElement);
    expect(updateElementSpy.getCall(2).args[0]).toBe(newElement);
  });
});
