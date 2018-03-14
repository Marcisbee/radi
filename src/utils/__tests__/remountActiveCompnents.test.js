import sinon from 'sinon';
import GLOBALS from '../../consts/GLOBALS';
import remountActiveComponents from '../remountActiveComponents';

afterAll(() => {
  GLOBALS.ACTIVE_COMPONENTS = {};
});

describe('remountActiveComponents.js', () => {
  it('calls the onMount method on all active components', () => {
    const onMountSpy = sinon.spy();
    GLOBALS.ACTIVE_COMPONENTS.foo = { onMount: onMountSpy };

    const onMountSpy2 = sinon.spy();
    GLOBALS.ACTIVE_COMPONENTS.bar = { onMount: onMountSpy2 };

    remountActiveComponents();

    expect(onMountSpy.calledOnce).toBe(true);
    expect(onMountSpy.getCall(0).args[0]).toBe(GLOBALS.ACTIVE_COMPONENTS.foo);
    expect(onMountSpy2.calledOnce).toBe(true);
    expect(onMountSpy2.getCall(0).args[0]).toBe(GLOBALS.ACTIVE_COMPONENTS.bar);
  });

  it('doesn\'t crash when a component doesn\'t have an onMount method', () => {
    GLOBALS.ACTIVE_COMPONENTS.baz = {};
    remountActiveComponents();
  });
});
