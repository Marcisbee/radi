import Radi from '../Radi';

describe('Radi.js', () => {
  it('doesn\'t crash', () => {
    new Radi({
      state: {},
      props: {},
      actions: {},
      $mixins: {},
      $view: () => () => document.createElement('h1'),
      name: 'foobar'
    });
  });
});
