import StyleListener from '../StyleListener';

describe('StyleListener.js', () => {
  it('instantiates correctly', () => {
    const styleListener = new StyleListener({
      styleKey: 'foo',
      listener: {
        style: { foo: 'bar' }
      },
      element: {
        style: { foo: 'baz' }
      },
    });
    expect(styleListener.styleKey).toBe('foo');
    expect(styleListener.listener).toEqual({ style: { foo: 'bar' } });
    expect(styleListener.element).toEqual({ style: { foo: 'baz' } });
    expect(styleListener.attached).toBe(false);
  });

  it('attaches and updates correctly', () => {
    const options = {
      styleKey: 'foo',
      listener: {
        onValueChange: (callback) => {
          callback('bar');
        },
        applyDepth: () => options.listener,
        init: () => {},
      },
      element: {
        style: {},
      },
    };
    const styleListener = new StyleListener(options);
    const result = styleListener.attach();
    expect(result).toBe(styleListener);
    expect(options.element.styleListeners[0]).toBe(styleListener);
  });

  it('updates its element correctly', () => {
    const styleListener = new StyleListener({
      styleKey: 'foo',
      listener: {},
      element: {},
    });
    styleListener.updateElement({ foo: 'bar' });
    expect(styleListener.element).toEqual({ foo: 'bar' });
  });
});
