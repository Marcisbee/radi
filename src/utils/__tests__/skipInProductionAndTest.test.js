import skipInProductionAndTest from '../skipInProductionAndTest';

describe('skip in production', () => {
  it('should execute a given function only in development mode, not in test or production', () => {
    const fn = jest.fn();
    skipInProductionAndTest(fn);
    expect(fn).not.toHaveBeenCalled();
  });
});
