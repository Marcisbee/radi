import Component from '../../component/Component';
import Listener from '../../listen/Listener';
import appendChild from '../appendChild';

describe('appendChild.js', () => {
  it('is a curried function', () => {
    expect(typeof appendChild(7)).toBe('function');
  });

  it("renders 0 when child is 0", () => {
    const element = document.createElement('div');
    appendChild(element)(0);
    expect(element.innerHTML).toBe('0');
  });

  it("renders empty node when child is falsy", () => {
    const element = document.createElement('div');
    appendChild(element)(null);
    expect(element.innerHTML).toBe('');
  });

  it('renders components before adding them', () => {
    const element = document.createElement('div');
    const component = new Component({
      view: () => document.createElement('span'),
    });
    appendChild(element)(component);
    expect(element.innerHTML).toBe('<span></span>');
  });

  it('retrieves the value of listeners before adding them', () => {
    const element = document.createElement('div');
    const listener = new Listener(
      {
        foo: 'bar',
        addListener: () => {},
      },
      'foo'
    );
    appendChild(element)(listener);
    expect(element.innerHTML).toBe('bar');
  });

  it('appends arrays correctly', () => {
    const element = document.createElement('div');
    appendChild(element)([document.createElement('h1'), document.createElement('span')]);
    expect(element.innerHTML).toBe('<h1></h1><span></span>');
  });

  it('appends nodes correctly', () => {
    const element = document.createElement('div');
    appendChild(element)(document.createElement('h1'));
    expect(element.innerHTML).toBe('<h1></h1>');
  });

  it('appends values of other types as a text node', () => {
    const element = document.createElement('div');
    appendChild(element)('foo');
    expect(element.childNodes[0]).toEqual(document.createTextNode('foo'));
    appendChild(element)(7);
    expect(element.childNodes[1]).toEqual(document.createTextNode(7));
  });
});
