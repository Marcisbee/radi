import listen from '../listen';
import Listener from '../listen/Listener';

describe('listen.js', () => {
  it('instantiates a Listener', () => {
    const fakeComponent = {
      foo: 'bar',
      addListener: () => {},
    };
    const listener = listen(fakeComponent, 'foo');
    expect(listener).toBeInstanceOf(Listener);
    expect(listener.component).toEqual({ foo: 'bar' });
    expect(listener.key).toBe('foo');
  });
});
