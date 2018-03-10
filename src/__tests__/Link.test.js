import Link from '../Link';

// TODO: Test properly
describe('Link.js', () => {
  it('doesn\'t crash', () => {
    new Link({}, () => {}, {}, 'foobar');
  });
});
