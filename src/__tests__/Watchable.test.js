import Watchable from '../Watchable';

// TODO: Test properly
describe('Watchable.js', () => {
  it('doesn\'t crash', () => {
    new Watchable({ __path: 'foobar' }, '__path', () => {});
  });
});
