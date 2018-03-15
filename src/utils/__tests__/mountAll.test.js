import sinon from 'sinon';
import mountAll from '../mountAll';

describe('mountAll.js', () => {
  it('mounts the given element', () => {
    const mountSpy = sinon.spy();
    const element = { mount: mountSpy };
    mountAll(element);
    expect(mountSpy.calledOnce).toBe(true);
  });

  it('mounts the children of the given element if they exist', () => {
    const childMountSpy = sinon.spy();
    const element = {
      children: [{ mount: childMountSpy }, { mount: childMountSpy }, { mount: childMountSpy }]
    };
    mountAll(element);
    expect(childMountSpy.callCount).toBe(3);
  });
});
