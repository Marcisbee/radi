import sinon from 'sinon';
import {
  isString,
  isNumber,
  isFunction,
  isNode,
  isComponent,
  text,
  set,
  link,
  _Radi,
} from '../index';
import mount from '../mount';
import GLOBALS from '../consts/GLOBALS';
import r from '../r';
import l from '../utilities/l';
import component from '../utilities/component';

afterAll(() => {
  GLOBALS.FROZEN_STATE = false;
  GLOBALS.HTML_CACHE = {};
  GLOBALS.ACTIVE_COMPONENTS = [];
  GLOBALS.REGISTERED = [];
});

describe('index.js', () => {
/*  test('its isNode function works', () => {
    expect(isNode(document.createElement('div'))).toBe(true);
    expect(isNode(7)).toBe(false);
  }); */

  // TODO: Make this test pass by making the container an actual Node
  /* test('its mount function works', () => {
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
  }); */

  // TODO: Test list function

  /* test('its list function returns an empty string when its data parameter is falsy', () => {
    expect(list(false, true)).toBe('');
  }); */

/*  test('its set function works', () => {
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
  }); */

  // test('its link function works', () => {
  // TODO: Too big to properly test
  // });

/*  test('its cond function works', () => {
    const condition = cond(5, 6);
    expect(condition).toBeInstanceOf(Condition);
    expect(condition.cases[0]).toEqual({
      a: 5,
      e: 6
    });
  }); */

  // test('its ll function works', () => {
  // TODO: Link function isn't tested and its parameters are too unclear to
  // make a viable test
  // });

  it('provides a _Radi namespace', () => {
    expect(_Radi).toEqual(expect.objectContaining({
      version: GLOBALS.VERSION,
      activeComponents: GLOBALS.ACTIVE_COMPONENTS,
      l,
      r,
      component,
      mount,
    }));
    expect(GLOBALS.FROZEN_STATE).toBe(false);
    _Radi.freeze();
    expect(GLOBALS.FROZEN_STATE).toBe(true);

    const onMountSpy = sinon.spy();
    GLOBALS.ACTIVE_COMPONENTS = [
      {
        onMount: onMountSpy,
      },
      {
        onMount: onMountSpy,
      },
    ];

    _Radi.unfreeze();
    expect(GLOBALS.FROZEN_STATE).toBe(false);
    expect(onMountSpy.callCount).toBe(2);
  });

  // TODO: Add tests for the setAttr function

  // TODO: Add tests for the radiArgs function

  // TODO: Add tests for the afterAppendChild function

  // TODO: Add tests for the updateBind function

  // TODO: Add tests for the updateBundInnerFn function
});
