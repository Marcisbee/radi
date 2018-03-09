import sinon from 'sinon';
import { createElement } from '../createElement';

beforeAll(() => {
  global.oldDocument = document;
  global.document = {};
});

afterAll(() => {
  global.document = global.oldDocument;
  global.oldDocument = undefined;
});

describe('createElement.js', () => {
  it('creates an element with given query', () => {
    const createElementSpy = sinon.spy();
    document.createElement = createElementSpy;
    createElement('div');
    expect(createElementSpy.calledOnce).toBe(true);
    expect(createElementSpy.getCall(0).args).toEqual(['div']);
  });

  it('creates an element with given query and given namespace URI', () => {
    const createElementNSSpy = sinon.spy();
    document.createElementNS = createElementNSSpy;
    createElement('div', 'http://www.w3.org/1999/xhtml');
    expect(createElementNSSpy.calledOnce).toBe(true);
    expect(createElementNSSpy.getCall(0).args).toEqual([
      'http://www.w3.org/1999/xhtml',
      'div'
    ]);
  });
});
