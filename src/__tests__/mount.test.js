import mount from '../mount';
import Component from '../component/Component';

describe('mount.js', () => {
  it('appends the rendered element to given container', () => {
    const container = document.createElement('div');
    const element = document.createElement('h1');
    mount(element, container);
    expect(container.innerHTML).toBe('<h1></h1>');
  });

  it('returns the rendered element', () => {
    const element = document.createElement('h1');
    const result = mount(element, document.createElement('div'));
    expect(result).toBe(element);

    const span = document.createElement('span');
    class TestComponent extends Component {
      view() {
        return span;
      }
    }
    const result2 = mount(new TestComponent(), document.createElement('div'));
    expect(result2).toBeInstanceOf(HTMLSpanElement);
  });

  it('mounts components and normal elements', () => {
    const container = document.createElement('div');
    const span = document.createElement('span');
    class TestComponent extends Component {
      view() {
        return span;
      }
    }
    mount(new TestComponent(), container);
    expect(container.innerHTML).toBe('<span></span>');
  });
});
