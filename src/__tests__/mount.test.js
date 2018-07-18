import mount from '../mount';
import r from '../r';
// import Component from '../component/Component';

describe('mount.js', () => {
  it('mounts text', () => {
    const container = document.createElement('div');
    mount('Foo', container);
    expect(container.innerHTML).toBe('Foo');
  });

  it('mounts numbers', () => {
    const container = document.createElement('div');
    mount(0, container);
    expect(container.innerHTML).toBe('0');
  });

  it('mounts array of text', () => {
    const container = document.createElement('div');
    mount(['Foo', 0, 1], container);
    expect(container.innerHTML).toBe('Foo01');
  });

  it('mounts template', () => {
    const container = document.createElement('div');
    mount(r('template', {}, r('template', {}, 'Foo', 0)), container);
    expect(container.innerHTML).toBe('<section><section>Foo0</section></section>');
  });

  it('mounts hyperscript', () => {
    const container = document.createElement('div');
    mount(r('h1', {}, 'Foo', 0), container);
    expect(container.innerHTML).toBe('<h1>Foo0</h1>');
  });

  it('mounts children', () => {
    const container = document.createElement('div');
    mount(r('h1', {}, r('h2', {}, 'Foo'), 'Bar'), container);
    expect(container.innerHTML).toBe('<h1><h2>Foo</h2>Bar</h1>');
  });

  it('mounts middleware', () => {
    const container = document.createElement('div');
    mount(() => 'Foo', container);
    expect(container.innerHTML).toBe('Foo');
  });

  it('mounts promise', () => {
    const container = document.createElement('div');
    const Prom = new Promise((resolve) => {
      resolve('Foo');
      expect(container.innerHTML).toBe('Foo');
    });
    mount(Prom, container);
  });

  it('mounts dom nodes', () => {
    const container = document.createElement('div');
    const span = document.createElement('span');
    span.innerHTML = 'Foo';
    mount(span, container);
    expect(container.innerHTML).toBe('<span>Foo</span>');
  });

  // it('appends the rendered element to given container', () => {
  //   const container = document.createElement('div');
  //   const element = document.createElement('h1');
  //   mount(element, container);
  //   expect(container.innerHTML).toBe('<h1></h1>');
  // });
  //
  // it('returns the rendered element', () => {
  //   const parent = document.createElement('div');
  //   const element = document.createElement('h1');
  //   const result = mount(element, parent);
  //   expect(result).toBe(parent);
  //
  //   const span = document.createElement('span');
  //   class TestComponent extends Component {
  //     view() {
  //       return span;
  //     }
  //   }
  //   const result2 = mount(new TestComponent(), document.createElement('div'));
  //   expect(result2).toBeInstanceOf(HTMLDivElement);
  // });
  //
  // it('mounts components and normal elements', () => {
  //   const container = document.createElement('div');
  //   const span = document.createElement('span');
  //   class TestComponent extends Component {
  //     view() {
  //       return span;
  //     }
  //   }
  //   mount(new TestComponent(), container);
  //   expect(container.innerHTML).toBe('<span></span>');
  // });
});
