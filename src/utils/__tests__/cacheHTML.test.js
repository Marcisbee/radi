import GLOBALS from '../../consts/GLOBALS';
import cacheHTML from '../cacheHTML';

afterEach(() => {
  GLOBALS.HTML_CACHE = {};
});

describe('cacheHTML.js', () => {
  it('returns the requested element from cache', () => {
    GLOBALS.HTML_CACHE.div = { foo: 'bar' };
    expect(cacheHTML('div')).toEqual({ foo: 'bar' });
  });

  it('adds the requested element to cache if it\'s not there yet', () => {
    expect(cacheHTML('span')).toBeInstanceOf(HTMLSpanElement);
    expect(GLOBALS.HTML_CACHE.span).toBeInstanceOf(HTMLSpanElement);
  });
});
