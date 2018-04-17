import skipInProductionAndTest from '../skipInProductionAndTest';

describe('skip in production', () => {
  const env = Object.assign({}, process.env);

  afterEach(() => {
    process.env = env;
  });

  it('should execute a given function only in development mode', () => {
    const fn = jest.fn();
    process.env.NODE_ENV = 'development';
    skipInProductionAndTest(fn);
    expect(fn).toHaveBeenCalled();
  });

  it('should NOT execute a given function in production mode', () => {
    const fn = jest.fn();
    process.env.NODE_ENV = 'production';
    skipInProductionAndTest(fn);
    expect(fn).not.toHaveBeenCalled();
  });

  it('should NOT execute a given function in test mode', () => {
    const fn = jest.fn();
    process.env.NODE_ENV = 'test';
    skipInProductionAndTest(fn);
    expect(fn).not.toHaveBeenCalled();
  });
});
