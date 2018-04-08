/* eslint-disable no-prototype-builtins */
import sinon from 'sinon';
import GLOBALS from '../../consts/GLOBALS';
import { Component } from '../../component';
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

describe('Component Decoration', () => {
  it('instantiates correctly', () => {
    const actionSpy = sinon.spy();
    const viewSpy = sinon.spy();

    let testComp = class {
      constructor() {
        this.name = 'Foo';
        this.mixins = { foo: 'bar' };
        this.state = { bar: 'foo' };
        this.props = { baz: 7 };
        this.actions = { setFoo: actionSpy };
      }
      view() {
        viewSpy();
        return { a: 'b' };
      }
    };

    testComp = Component(testComp);

    const component = new testComp([1, 2, 3]);
    console.log(component.valueOf());

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
});
