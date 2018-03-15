import sinon from 'sinon';
import Listener from '../Listener';

beforeEach(() => {
  global.fakeComponent = {
    foo: 'bar',
    addListener: () => {}
  };
});

afterEach(() => {
  delete global.fakeComponent;
});

describe('Listener.js', () => {
  it('instantiates correctly', () => {
    const addListenerSpy = sinon.spy();
    const fakeComponent = {
      foo: 'bar',
      addListener: addListenerSpy
    };
    const listener = new Listener(fakeComponent, 'foo');
    expect(listener.component).toBe(fakeComponent);
    expect(listener.key).toBe('foo');
    expect(listener.childPath).toEqual([]);
    expect(listener.value).toBe('bar');
    expect(addListenerSpy.calledOnce).toBe(true);
    expect(addListenerSpy.getCall(0).args).toEqual(['foo', listener]);
  });

  it('it stores the key and child path correctly', () => {
    const fakeComponent = {
      foo: {
        bar: {
          baz: 'foo'
        }
      },
      addListener: () => {}
    };
    const listener = new Listener(fakeComponent, 'foo', 'bar', 'baz');
    expect(listener.key).toBe('foo');
    expect(listener.childPath).toEqual(['bar', 'baz']);
  });

  it('handles updates correctly', () => {
    const listener = new Listener(fakeComponent, 'foo');
    expect(listener.value).toBe('bar');
    listener.handleUpdate('baz');
    expect(listener.value).toBe('baz');
  });

  it('adds change listeners and invokes them', () => {
    const changeListener = sinon.spy();
    const listener = new Listener(fakeComponent, 'foo');
    listener.onValueChange(changeListener);
    expect(listener.changeListeners[0]).toBe(changeListener);
    expect(changeListener.calledOnce).toBe(true);
    expect(changeListener.getCall(0).args[0]).toBe('bar');
    listener.handleUpdate('baz');
    expect(changeListener.callCount).toBe(2);
    expect(changeListener.getCall(1).args[0]).toBe('baz');
  });

  it('adds and uses custom value processing functions', () => {
    const listener = new Listener(fakeComponent, 'foo').process(value => value + value);
    expect(listener).toBeInstanceOf(Listener);
    expect(listener.value).toBe('barbar');
    listener.handleUpdate('baz');
    expect(listener.value).toBe('bazbaz');
  });

  it('handles child paths correctly through shallow value retrieval', () => {
    const fakeComponent = {
      foo: {
        bar: {
          baz: 7
        }
      },
      addListener: () => {}
    };
    const listener = new Listener(fakeComponent, 'foo', 'bar', 'baz');
    expect(listener.value).toBe(7);
    listener.handleUpdate({ bar: { baz: 8 } });
    expect(listener.value).toBe(8);
  });
});
