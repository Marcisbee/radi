import sinon from 'sinon';
import copyAttributeListeners from '../copyAttributeListeners';

describe('copyAttributeListeners.js', () => {
  it('copies the attribute listeners correctly', () => {
    const oldElement = {
      attributeListeners: [
        { updateElement: () => {} },
        { updateElement: () => {} },
        { updateElement: () => {} },
      ],
    };
    const newElement = {};
    const result = copyAttributeListeners(oldElement, newElement);
    expect(result).toBe(newElement);
    expect(newElement.attributeListeners).toBe(oldElement.attributeListeners);
  });

  it('doesn\'t do anything when given oldElement doesn\'t have any listeners', () => {
    const oldElement = {};
    const newElement = {};
    const result = copyAttributeListeners(oldElement, newElement);
    expect(result).toBe(newElement);
    expect(newElement.attributeListeners).toBeUndefined();
  });

  it('calls the updateElement method on all attributeListeners', () => {
    const updateElementSpy = sinon.spy();
    const oldElement = {
      attributeListeners: [
        { updateElement: updateElementSpy },
        { updateElement: updateElementSpy },
        { updateElement: updateElementSpy },
      ],
    };
    const newElement = { foo: 'bar' };
    copyAttributeListeners(oldElement, newElement);
    expect(updateElementSpy.callCount).toBe(3);
    expect(updateElementSpy.getCall(0).args[0]).toBe(newElement);
    expect(updateElementSpy.getCall(1).args[0]).toBe(newElement);
    expect(updateElementSpy.getCall(2).args[0]).toBe(newElement);
  });
});
