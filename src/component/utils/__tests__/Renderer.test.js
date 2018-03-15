import Renderer from '../Renderer';

describe('Renderer.js', () => {
  it('instantiates correctly', () => {
    const renderer = new Renderer('foo');
    expect(renderer.component).toBe('foo');
    expect(renderer.html).toBeInstanceOf(DocumentFragment);
  });

  it('renders correctly', () => {
    const renderer = new Renderer({ $view: document.createElement('h1') });
    const html = renderer.render();
    expect(html).toEqual(renderer.html);
    expect(html).toBeInstanceOf(DocumentFragment);
    expect(html.childNodes[0]).toBeInstanceOf(HTMLHeadingElement);
  });

  it('destroys the HTML correctly', () => {
    const renderer = new Renderer({ $view: document.createElement('h1') });
    const html = renderer.render();
    expect(html.childNodes[0]).toBeInstanceOf(HTMLHeadingElement);
    renderer.destroyHtml();
    expect(html.childNodes[0]).toBeUndefined();
    renderer.destroyHtml();
    expect(html.childNodes[0]).toBeUndefined();
  });
});
