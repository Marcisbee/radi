import Radi from '../Radi';

describe('Radi.js', () => {
  it('doesn\'t crash', () => {
    new Radi({
      state: { foo: 'bar' },
      props: { bar: 'foo' },
      actions: { hey: () => { console.log('hey'); } },
      $mixins: {},
      $view: () => document.createElement('h1'),
      name: 'foobar',
    });
  });
});
