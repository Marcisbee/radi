import sinon from 'sinon';
import getElementFromQuery from '../getElementFromQuery';

beforeEach(() => {
  global.originalWarn = console.warn;
  console.warn = sinon.spy();
});

afterEach(() => {
  console.warn = global.originalWarn;
  delete global.originalWarn;
});

describe('getElementFromQuery.js', () => {
  it('creates an element from given query', () => {
    const element = getElementFromQuery('h1');
    expect(element).toBeInstanceOf(HTMLHeadingElement);
    const invalidElement = getElementFromQuery('ohno'); // eslint-disable-line
    expect(element).toBeInstanceOf(HTMLElement);
    const invalidQuery = getElementFromQuery(false); // eslint-disable-line
    expect(element).toBeInstanceOf(HTMLElement);
  });

  it('gives a warning when query is not a string', () => {
    const invalidQuery = getElementFromQuery(true); // eslint-disable-line
    expect(console.warn.calledOnce).toBe(true);
  });
});
