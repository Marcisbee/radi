import Watcher from '../Watcher';

// TODO: Test properly
describe('Watcher.js', () => {
  it('doesn\'t crash', () => {
    new Watcher({}, {}, {}, 'test');
  });
});
