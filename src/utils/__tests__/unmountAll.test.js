import sinon from 'sinon';
import unmountAll from '../unmountAll';

describe('unmountAll.js', () => {
  it('unmounts the given element', () => {
    const unmountSpy = sinon.spy();
    const element = { unmount: unmountSpy };
    unmountAll(element);
    expect(unmountSpy.calledOnce).toBe(true);
  });

  it('unmounts the children of the given element if they exist', () => {
    const childMountSpy = sinon.spy();
    const element = {
      children: [
        { unmount: childMountSpy },
        { unmount: childMountSpy },
        { unmount: childMountSpy }
      ]
    };
    unmountAll(element);
    expect(childMountSpy.callCount).toBe(3);
  });
});
