import Condition from '../Condition';

// TODO: Test properly
describe('Condition.js', () => {
  it('doesn\'t crash', () => {
    new Condition(1, 2, {});
  });

  it('works', () => {
    const condition = new Condition(5, 6, window);
    expect(condition.cases[0]).toEqual({
      a: 5,
      e: 6
    });
    // TODO: Add proper tests
  });
});
