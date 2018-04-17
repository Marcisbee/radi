/* eslint-disable no-prototype-builtins */
import sinon from 'sinon';
import GLOBALS from '../../consts/GLOBALS';
import Component from '../Component';
import PrivateStore from '../utils/PrivateStore';

beforeAll(() => {
  global.fakeView = () => document.createElement('h1');
});

afterAll(() => {
  delete global.fakeView;
});

afterEach(() => {
  GLOBALS.ACTIVE_COMPONENTS = {};
});

describe('Component.js', () => {
  it('instantiates correctly', () => {
    const actionSpy = sinon.spy();
    const viewSpy = sinon.spy();
    class Fake extends Component {
      constructor(children, props) {
        super(children, props);
        this.setFoo = actionSpy;
      }

      state() {
        return { foo: 'bar' };
      }

      view() {
        viewSpy();
        return { a: 'b' };
      }
    }
    const component = new Fake([1, 2, 3], { baz: 7 });

    expect(component.$id).toBeDefined();

    expect(typeof component.setFoo).toBe('function');
    expect(component.state.foo).toBe('bar');
    expect(component.state.baz).toBe(7);
    component.setFoo(9);
    expect(actionSpy.calledOnce).toBe(true);
    expect(actionSpy.getCall(0).args[0]).toBe(9);

    expect(component.children).toEqual([1, 2, 3]);

    expect(component.$privateStore).toBeInstanceOf(PrivateStore);

    expect(component.view()).toEqual(expect.objectContaining({ a: 'b' }));
    expect(viewSpy.calledOnce).toBe(true);

    expect(component.$id.propertyIsEnumerable()).toBe(false);
    expect(component.state.propertyIsEnumerable()).toBe(false);
    expect(component.$privateStore.propertyIsEnumerable()).toBe(false);
    expect(component.view.propertyIsEnumerable()).toBe(false);
  });

  test('its copyObjToInstance method works correctly', () => {
    class Fake extends Component {};
    const component = new Fake();
    component.copyObjToInstance({ foo: 'bar' });
    expect(component.foo).toBe('bar');
  });

  test('its setProps method works correctly', () => {
    class Fake extends Component {};
    const component = new Fake([], { foo: null });
    component.setProps({ foo: 'bar' });
    expect(component.state.foo).toBe('bar');
    component.setProps({ bar: 'foo' });
    expect(component.state.bar).toBe('foo');

    expect(component.setProps({})).toBe(component);
  });

  test('its setChildren method works correctly', () => {
    class Fake extends Component {};
    const component = new Fake();
    expect(component.children).toEqual([]);
    const result = component.setChildren([3, 2, 1]);
    expect(component.children).toEqual([3, 2, 1]);
    expect(result).toBe(component);
  });

  test('its addNonEnumerableProperties method works correctly', () => {
    class Fake extends Component {};
    const component = new Fake([], { foo: 'bar' });
    component.addNonEnumerableProperties({ foo: 7, bar: 'baz' });
    expect(component.foo).toBe(7);
    expect(component.bar).toBe('baz');
    expect(component.foo.propertyIsEnumerable()).toBe(false);
    expect(component.bar.propertyIsEnumerable()).toBe(false);
  });

  test('its addListener method works correctly', () => {
    class Fake extends Component {};
    const component = new Fake([], { foo: 'bar' });
    const listener = { handleUpdate: sinon.spy() };
    component.addListener('foo', listener);
    expect(component.$privateStore.store.foo.listeners[0]).toBe(listener);
    expect(listener.handleUpdate.calledOnce).toBe(true);
    component.setState({foo: 'baz'});
    expect(listener.handleUpdate.callCount).toBe(2);
    expect(listener.handleUpdate.getCall(1).args[0]).toBe('baz');
  });

  test('its mount method works correctly', () => {
    const onMountSpy = sinon.spy();
    class Fake extends Component {
      constructor() {
        super();
        this.on = {
          mount: onMountSpy,
        };
      }
    };
    const component = new Fake();
    component.mount();
    expect(onMountSpy.calledOnce).toBe(true);
  });

  test('its destroy method works correctly', () => {
    const onDestroySpy = sinon.spy();
    class Fake extends Component {
      constructor() {
        super();
        this.on = {
          destroy: onDestroySpy,
        };
      }
    };
    const component = new Fake();
    component.render();
    const destroyed = component.destroy();
    expect(onDestroySpy.calledOnce).toBe(true);
    expect(component.html).toBe(null);
  });

  test('its render method works correctly', () => {
    const onMountSpy = sinon.spy();
    class Fake extends Component {
      constructor() {
        super();
        this.on = {
          mount: onMountSpy,
        };
      }
      view() {
        return document.createElement('h1');
      }
    };
    const component = new Fake();
    const rendered = component.render();
    component.mount();
    expect(onMountSpy.calledOnce).toBe(true);
    expect(rendered).toBeInstanceOf(HTMLHeadingElement);
  });

  test('its static isComponent method returns true', () => {
    expect(Component.isComponent()).toBe(true);
  });
});
