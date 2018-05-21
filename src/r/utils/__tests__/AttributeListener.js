import sinon from 'sinon';
import AttributeListener from '../AttributeListener';

describe('AttributeListener.js', () => {
  it('instantiates correctly', () => {
    const attributeListener = new AttributeListener({
      attributeKey: 'foo',
      listener: { foo: 'bar' },
      element: { bar: 'foo' },
    });
    expect(attributeListener.attributeKey).toBe('foo');
    expect(attributeListener.listener).toEqual({ foo: 'bar' });
    expect(attributeListener.element).toEqual({ bar: 'foo' });
    expect(attributeListener.attached).toBe(false);
  });

  it('attaches and updates correctly', () => {
    const setAttributeSpy = sinon.spy();
    const options = {
      attributeKey: 'foo',
      listener: {
        onValueChange: (callback) => {
          callback('bar');
        },
      },
      element: {
        setAttribute: setAttributeSpy,
      },
    };
    const attributeListener = new AttributeListener(options);
    const result = attributeListener.attach();
    expect(result).toBe(attributeListener);
    expect(options.element.attributeListeners[0]).toBe(attributeListener);
    expect(setAttributeSpy.calledOnce).toBe(true);
    expect(setAttributeSpy.getCall(0).args).toEqual(['foo', 'bar']);
  });

  it('updates its element correctly', () => {
    const attributeListener = new AttributeListener({
      attributeKey: 'foo',
      listener: {},
      element: {},
    });
    attributeListener.updateElement({ foo: 'bar' });
    expect(attributeListener.element).toEqual({ foo: 'bar' });
  });
});
