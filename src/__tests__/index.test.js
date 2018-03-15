import sinon from 'sinon';
import Radi from '../index';
import mount from '../mount';
import GLOBALS from '../consts/GLOBALS';
import r from '../r';
import listen from '../listen';
import component from '../component';

afterAll(() => {
  GLOBALS.FROZEN_STATE = false;
  GLOBALS.HTML_CACHE = {};
  GLOBALS.ACTIVE_COMPONENTS = [];
  GLOBALS.REGISTERED = [];
});

describe('index.js', () => {
  it('provides a Radi namespace', () => {
    expect(Radi).toEqual(expect.objectContaining({
      version: GLOBALS.VERSION,
      activeComponents: GLOBALS.ACTIVE_COMPONENTS,
      r,
      listen,
      l: listen,
      component,
      mount,
    }));
    expect(GLOBALS.FROZEN_STATE).toBe(false);
    Radi.freeze();
    expect(GLOBALS.FROZEN_STATE).toBe(true);

    const onMountSpy = sinon.spy();
    GLOBALS.ACTIVE_COMPONENTS = {
      foo: {
        onMount: onMountSpy,
      },
      bar: {
        onMount: onMountSpy,
      },
    };

    Radi.unfreeze();
    expect(GLOBALS.FROZEN_STATE).toBe(false);
    expect(onMountSpy.callCount).toBe(2);
  });

  it('adds the Radi namespace to the window', () => {
    expect(window.$Radi).toBe(Radi);
  });
});
