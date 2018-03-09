import sinon from 'sinon';
import {
  isString,
  isNumber,
  isFunction,
  isNode,
  isWatchable,
  isCondition,
  isComponent,
  ensureEl,
  getEl,
  text,
  mount,
  list,
  set,
  NW,
  link,
  cond,
  Condition,
  ll,
  register,
  setAttr,
  radiArgs,
  afterAppendChild,
  updateBind,
  updateBundInnerFn,
  Radi,
  _Radi
} from '../index';
import { GLOBALS } from '../consts/GLOBALS';
import { r } from '../utilities/r';
import { component } from '../utilities/component';

afterAll = () => {
  GLOBALS.FROZEN_STATE = false;
  GLOBALS.HTML_CACHE = {};
  GLOBALS.ACTIVE_COMPONENTS = [];
  GLOBALS.REGISTERED = [];
};

describe('index.js', () => {
  test('its isString function works', () => {
    expect(isString('foobar')).toBe(true);
    expect(isString(7)).toBe(false);
  });

  test('its isNumber function works', () => {
    expect(isNumber(7)).toBe(true);
    expect(isNumber('foobar')).toBe(false);
  });

  test('its isFunction funtion works', () => {
    expect(isFunction(() => {})).toBe(true);
    expect(isFunction('foobar')).toBe(false);
  });

  test('its isNode function works', () => {
    expect(isNode(document.createElement('div'))).toBe(true);
    expect(isNode(7)).toBe(false);
  });

  test('its isWatchable function works', () => {
    const watchable = new NW({ __path: 'foo', bar: 'baz' }, 'bar', () => {});
    expect(isWatchable(watchable)).toBe(true);
    expect(isWatchable(7)).toBe(false);
  });

  test('its isCondition function works', () => {
    const condition = new Condition(7, 8, 9);
    expect(isCondition(condition)).toBe(true);
    expect(isCondition(4)).toBe(false);
  });

  test('its isComponent function works', () => {
    const fakeComponent = { __radi: true };
    expect(isComponent(fakeComponent)).toBe(true);
    expect(isComponent('foobar')).toBe(false);
  });

  test('its ensureEl function ensures its parameter is an element', () => {
    global.html = sinon.spy();
    expect(ensureEl(document.createElement('div'))).toBeInstanceOf(HTMLDivElement);
    expect(html.calledOnce).toBe(false);
    expect(ensureEl('div')).toBeUndefined();
    expect(html.calledOnce).toBe(true);
    expect(html.getCall(0).args[0]).toBe('div');
    global.html = undefined;
  });

  test('its getEl function gets the element', () => {
    expect(getEl(document.createElement('div'))).toBeInstanceOf(HTMLDivElement);
    const fakeEl = { el: false };
    expect(getEl(fakeEl)).toBe(fakeEl);
    const fakeElTwo = { el: document.createElement('div') };
    expect(getEl(fakeElTwo)).toBeInstanceOf(HTMLDivElement);
  });

  test('its text function creates a text node', () => {
    expect(text('foobar')).toBeInstanceOf(Text);
  });

  // TODO: Make this test pass by making the container an actual Node
  /*test('its mount function works', () => {
    const testComponent = component({
      view: function() {
        return this.sample;
      },
      state: {
        sample: 'World'
      }
    });
    const container = document.createElement('div');
    expect(mount(testComponent, container)).toBe('World');
    expect(container.childNodes[0]).toBeInstanceOf(HTMLHeadingElement);
  });*/

  // TODO: Test list function

  test('its list function returns an empty string when its data parameter is falsy', () => {
    expect(list(false, true)).toBe('');
  });

  test('its set function works', () => {
    const source = {
      foo: {
        bar: {}
      }
    };
    expect(set(['foo', 'bar'], source, 'baz')).toBe('baz');
    expect(source).toEqual({
      bar: 'baz',
      foo: {
        bar: {}
      }
    });
  });

  test('its NW class works', () => {
    const source = { __path: 'foo', bar: 'baz' };
    const nw = new NW(source, 'bar', () => source);
    expect(nw.path).toBe('foo.bar');
    expect(nw.get()).toBe('baz');
    expect(nw.source).toEqual({
      __path: 'foo',
      bar: 'baz'
    });
    expect(nw.set('test')).toBe('test');
    expect(nw.source).toEqual({
      __path: 'foo',
      bar: 'test'
    });
    expect(nw.prop).toBe('bar');
    expect(nw.parent()).toBe(source);
  });

  //test('its link function works', () => {
    // TODO: Too big to properly test
  //});

  test('its cond function works', () => {
    const condition = cond(5, 6);
    expect(condition).toBeInstanceOf(Condition);
    expect(condition.cases[0]).toEqual({
      a: 5,
      e: 6
    });
  });

  test('its Condition class works', () => {
    const condition = new Condition(5, 6, window);
    expect(condition.cases[0]).toEqual({
      a: 5,
      e: 6
    });
    // TODO: Add proper tests
  });

  //test('its ll function works', () => {
    // TODO: Link function isn't tested and its parameters are too unclear to
    // make a viable test
  //});

  test('its _Radi object functions as a namespace', () => {
    expect(_Radi).toEqual(expect.objectContaining({
      version: GLOBALS.VERSION,
      activeComponents: GLOBALS.ACTIVE_COMPONENTS,
      r,
      cond,
      component,
      mount
    }));
    expect(_Radi.l('foo')).toBe('foo');
    expect(GLOBALS.FROZEN_STATE).toBe(false);
    _Radi.freeze();
    expect(GLOBALS.FROZEN_STATE).toBe(true);

    const onMountSpy = sinon.spy();
    GLOBALS.ACTIVE_COMPONENTS = [
      {
        onMount: onMountSpy
      },
      {
        onMount: onMountSpy
      }
    ];

    _Radi.unfreeze();
    expect(GLOBALS.FROZEN_STATE).toBe(false);
    expect(onMountSpy.callCount).toBe(2);
  });

  test('its register function registers given component', () => {
    const constructorSpy = sinon.spy();
    class FakeComponent {
      constructor() {
        constructorSpy();
        this.o = {
          name: 'test'
        };
      }
    }

    register(FakeComponent);
    expect(GLOBALS.REGISTERED.test.name).toBe('FakeComponent');
    expect(Object.keys(GLOBALS.REGISTERED)).toHaveLength(1);
    expect(constructorSpy.calledOnce).toBe(true);

    const constructorSpyTwo = sinon.spy();
    class FakeComponentTwo {
      constructor() {
        constructorSpyTwo();
        this.o = {
          name: 'test'
        };
      }
    }

    register(FakeComponentTwo);
    expect(GLOBALS.REGISTERED.test.name).toBe('FakeComponentTwo');
    expect(Object.keys(GLOBALS.REGISTERED)).toHaveLength(1);
    expect(constructorSpyTwo.calledOnce).toBe(true);

    const constructorSpyThree = sinon.spy();
    class FakeComponentThree {
      constructor() {
        constructorSpyThree();
        this.o = {
          name: null
        };
      }
    }

    register(FakeComponentThree);
    expect(Object.keys(GLOBALS.REGISTERED)).toHaveLength(1);
    expect(constructorSpyThree.calledOnce).toBe(true);
  });

  // TODO: Add tests for the Radi function/class

  // TODO: Add tests for the setAttr function

  // TODO: Add tests for the radiArgs function

  // TODO: Add tests for the afterAppendChild function

  // TODO: Add tests for the updateBind function

  // TODO: Add tests for the updateBundInnerFn function
});
