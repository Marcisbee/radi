/* eslint-disable no-prototype-builtins */
import sinon from 'sinon';
import GLOBALS from '../../consts/GLOBALS';
import ComponentClazz from '../Component';
import PrivateStore from '../utils/PrivateStore';
import Renderer from '../utils/Renderer';

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
    const component = new ComponentClazz(
      {
        name: 'Foo',
        mixins: { foo: 'bar' },
        state: { bar: 'foo' },
        props: { baz: 7 },
        actions: { setFoo: actionSpy },
        view: () => {
          viewSpy();
          return { a: 'b' };
        },
      },
      [1, 2, 3]
    );

    expect(component.name).toBe('Foo');
    expect(component.$id).toBeDefined();

    expect(component.$mixins).toEqual({
      foo: 'bar',
    });
    expect(component.$state).toEqual({
      bar: 'foo',
    });
    expect(component.$props).toEqual({
      baz: 7,
    });
    expect(typeof component.$actions.setFoo).toBe('function');
    expect(component.foo).toBe('bar');
    expect(component.bar).toBe('foo');
    expect(component.baz).toBe(7);
    expect(typeof component.setFoo).toBe('function');
    component.setFoo(9);
    expect(actionSpy.calledOnce).toBe(true);
    expect(actionSpy.getCall(0).args[0]).toBe(9);

    expect(component.children).toEqual([1, 2, 3]);

    expect(component.$privateStore).toBeInstanceOf(PrivateStore);
    expect(component.$renderer).toBeInstanceOf(Renderer);

    expect(viewSpy.calledOnce).toBe(true);
    expect(component.$view).toEqual(expect.objectContaining({ a: 'b' }));
    expect(component.$view.mount.name).toBe('bound mount');
    expect(component.$view.unmount.name).toBe('bound unmount');

    expect(component.$id.propertyIsEnumerable()).toBe(false);
    expect(component.$mixins.propertyIsEnumerable()).toBe(false);
    expect(component.$state.propertyIsEnumerable()).toBe(false);
    expect(component.$props.propertyIsEnumerable()).toBe(false);
    expect(component.$actions.propertyIsEnumerable()).toBe(false);
    expect(component.$privateStore.propertyIsEnumerable()).toBe(false);
    expect(component.$renderer.propertyIsEnumerable()).toBe(false);
    expect(component.$view.propertyIsEnumerable()).toBe(false);
  });

  test('its copyObjToInstance method works correctly', () => {
    const component = new ComponentClazz({ view: fakeView });
    component.copyObjToInstance({ foo: 'bar' });
    expect(component.foo).toBe('bar');
    component.copyObjToInstance({ bar: 'foo' }, item => item + item);
    expect(component.bar).toBe('foofoo');
  });

  test('its handleAction method works correctly', () => {
    const component = new ComponentClazz({ view: fakeView });
    expect(typeof component.handleAction(a => a)).toBe('function');

    const actionSpy = sinon.spy();
    component.handleAction(actionSpy)(1, 2, 3);
    expect(actionSpy.calledOnce).toBe(true);
    expect(actionSpy.getCall(0).args).toEqual([1, 2, 3]);
  });

  test('its setProps method works correctly', () => {
    const component = new ComponentClazz({ props: { foo: null }, view: fakeView });
    component.setProps({ foo: 'bar' });
    expect(component.foo).toBe('bar');
    component.setProps({ bar: 'foo' });
    expect(component.bar).toBe('foo');

    expect(component.setProps({})).toBe(component);
  });

  test('its setChildren method works correctly', () => {
    const component = new ComponentClazz({ view: fakeView });
    expect(component.children).toEqual([]);
    const result = component.setChildren([3, 2, 1]);
    expect(component.children).toEqual([3, 2, 1]);
    expect(result).toBe(component);
  });

  test('its addNonEnumerableProperties method works correctly', () => {
    const component = new ComponentClazz({ props: { foo: 'bar' }, view: fakeView });
    component.addNonEnumerableProperties({ foo: 7, bar: 'baz' });
    expect(component.foo).toBe('bar');
    expect(component.bar).toBe('baz');
    expect(component.foo.propertyIsEnumerable()).toBe(false);
    expect(component.bar.propertyIsEnumerable()).toBe(false);
  });

  test('its addCustomField method works correctly', () => {
    const component = new ComponentClazz({ view: fakeView });
    component.addCustomField('foo', 'bar');
    expect(component.foo).toBe('bar');
    expect(component.$privateStore.getItem('foo')).toBe('bar');
    component.foo = 8;
    expect(component.foo).toBe(8);
    expect(component.$privateStore.getItem('foo')).toBe(8);
  });

  test('its addListener method works correctly', () => {
    const component = new ComponentClazz({ props: { foo: 'bar' }, view: fakeView });
    const listener = { handleUpdate: sinon.spy() };
    component.addListener('foo', listener);
    expect(component.$privateStore.store.foo.listeners[0]).toBe(listener);
    expect(listener.handleUpdate.calledOnce).toBe(true);
    expect(listener.handleUpdate.getCall(0).args[0]).toBe('bar');
    component.foo = 'baz';
    expect(listener.handleUpdate.callCount).toBe(2);
    expect(listener.handleUpdate.getCall(1).args[0]).toBe('baz');
  });

  test('its isMixins method works correctly', () => {
    const component = new ComponentClazz({ mixins: { foo: 'bar' }, view: fakeView });
    expect(component.isMixin('foo')).toBe(true);
    expect(component.isMixin('bar')).toBe(false);
  });

  test('its mount method works correctly', () => {
    const onMountSpy = sinon.spy();
    const component = new ComponentClazz({
      view: fakeView,
      actions: { onMount: onMountSpy },
    });
    component.mount();
    expect(onMountSpy.calledOnce).toBe(true);
    expect(onMountSpy.getCall(0).args[0]).toBe(component);
  });

  test('its unmount method works correctly', () => {
    const onDestroySpy = sinon.spy();
    const component = new ComponentClazz({
      view: fakeView,
      actions: { onDestroy: onDestroySpy },
    });
    component.mount();
    component.unmount();
    expect(onDestroySpy.calledOnce).toBe(true);
    expect(onDestroySpy.getCall(0).args[0]).toBe(component);
  });

  test('its render method works correctly', () => {
    const onMountSpy = sinon.spy();
    const component = new ComponentClazz({
      view: () => document.createElement('h1'),
      actions: { onMount: onMountSpy },
    });
    const rendered = component.render();
    expect(onMountSpy.calledOnce).toBe(true);
    expect(rendered).toBeInstanceOf(DocumentFragment);
    expect(rendered.childNodes[0]).toBeInstanceOf(HTMLHeadingElement);
  });

  test('its destroy method works correctly', () => {
    const onDestroySpy = sinon.spy();
    const component = new ComponentClazz({
      view: () => document.createElement('h1'),
      actions: { onDestroy: onDestroySpy },
    });
    component.render();
    const destroyed = component.destroy();
    expect(onDestroySpy.calledOnce).toBe(true);
    expect(destroyed.childNodes).toBeUndefined();
  });

  test('its static isComponent method returns true', () => {f
    expect(ComponentClazz.isComponent()).toBe(true);
  });
});
