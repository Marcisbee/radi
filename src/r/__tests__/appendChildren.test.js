import sinon from 'sinon';
import appendChildren from '../appendChildren';
import appendChild from '../appendChild';

describe('appendChildren.js', () => {
  it('calls appendChild with each element of its parameter array', () => {
    const appendChildSpy = sinon.spy();
    const element = { appendChild: appendChildSpy };
    appendChildren(element, [1, 2, 3]);
    expect(appendChildSpy.callCount).toBe(3);
    expect(appendChildSpy.getCall(0).args[0]).toEqual(document.createTextNode(1));
    expect(appendChildSpy.getCall(1).args[0]).toEqual(document.createTextNode(2));
    expect(appendChildSpy.getCall(2).args[0]).toEqual(document.createTextNode(3));
  });
});
