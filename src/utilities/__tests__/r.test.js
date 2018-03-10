import sinon from 'sinon';
import GLOBALS from '../../consts/GLOBALS';
import r from '../r';

afterEach(() => {
  GLOBALS.REGISTERED = {};
  GLOBALS.HTML_CACHE = {};
  GLOBALS.R_KEYS = 0;
});

describe('r.js', () => {
  it('loads query from GLOBALS.REGISTERED if possible and calls it with given props', () => {
    const constructorSpy = sinon.spy();
    const propsSpy = sinon.spy();

    class TestDiv {
      constructor() {
        constructorSpy();
      }

      props(props) {
        propsSpy(props);
        return { a: 'b' };
      }
    }

    GLOBALS.REGISTERED.div = TestDiv;
    expect(r('div', { foo: 'bar' })).toEqual({ a: 'b' });
    expect(constructorSpy.calledOnce).toBe(true);
    expect(propsSpy.calledOnce).toBe(true);
    expect(propsSpy.getCall(0).args[0]).toEqual({ foo: 'bar' });
  });

  it('clones and caches query when query\'s not in GLOBALS.REGISTERED', () => {
    const element = r('span');
    expect(element).toBeInstanceOf(HTMLSpanElement);
    expect(GLOBALS.HTML_CACHE.span).toBeInstanceOf(HTMLSpanElement);
    expect(element === GLOBALS.HTML_CACHE.span).toBe(false);
  });

  it('clones query when it\'s a node', () => {
    const query = document.createElement('span');
    expect(r(query)).toBeInstanceOf(HTMLSpanElement);
    expect(r(query) === query).toBe(false)
  });

  it('creates a document fragment when query is neither a node nor a string', () => {
    expect(r(7)).toBeInstanceOf(DocumentFragment);
  });

  it('adds a key to the elemement created from query', () => {
    expect(GLOBALS.R_KEYS).toBe(0);
    expect(r(document.createElement('span')).key).toBe(0);
  });

  it('updates GLOBALS.R_KEYS', () => {
    expect(GLOBALS.R_KEYS).toBe(0);
    r(7);
    expect(GLOBALS.R_KEYS).toBe(1);
  });

  it('has an extend method', () => {
    expect(typeof r.extend).toBe('function');
  });

  test('its extend method gets a cached version of the element from query', () => {
    r('button');
    expect(GLOBALS.HTML_CACHE.button).toBeInstanceOf(HTMLButtonElement);
  });
});
