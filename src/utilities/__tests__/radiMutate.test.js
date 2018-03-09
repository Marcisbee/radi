import sinon from 'sinon';
import { radiMutate } from '../radiMutate';

describe('radiMutate.js', () => {
  it('calls the first parameter', () => {
    const fnSpy = sinon.spy();
    radiMutate(fnSpy);
    expect(fnSpy.calledOnce).toBe(true);
  });
});
