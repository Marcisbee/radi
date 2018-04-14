import sinon from 'sinon';
import PrivateStore from '../PrivateStore';

describe('PrivateStore.js', () => {
  it('it instantiates correctly', () => {
    const privateStore = new PrivateStore();
    expect(privateStore.store).toEqual({});
  });

  it('sets items correctly', () => {
    const privateStore = new PrivateStore();
    privateStore.setState({foo: 'bar'});
    expect(privateStore.store.foo).toEqual({
      listeners: [],
      value: 'bar',
    });
  });

  it('adds listeners correctly', () => {
    const privateStore = new PrivateStore();
    privateStore.setState({foo: 'bar'});
    const fakeListener = {
      handleUpdate: sinon.spy(),
    };
    privateStore.addListener('foo', fakeListener);
    expect(privateStore.store.foo.listeners[0]).toEqual(fakeListener);
    expect(fakeListener.handleUpdate.calledOnce).toBe(true);
    expect(fakeListener.handleUpdate.getCall(0).args[0]).toBe('bar');
  });

  it('triggers the attached listeners for an item when that item is updated', () => {
    const privateStore = new PrivateStore();
    privateStore.setState({foo: 'bar'});
    const fakeListener = {
      handleUpdate: sinon.spy(),
    };
    privateStore.addListener('foo', fakeListener);
    privateStore.setState({foo: 'baz'});
    expect(fakeListener.handleUpdate.callCount).toBe(2);
    expect(fakeListener.handleUpdate.getCall(1).args[0]).toBe('baz');
  });
});
