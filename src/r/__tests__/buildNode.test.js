import buildNode from '../buildNode'; // eslint-disable-line

/* @jsx buildNode.html(0) */
describe('r.js', () => {
  it('works correctly for normal elements', () => {
    const result = <h1/>;
    expect(result).toBeInstanceOf(HTMLHeadingElement);
  });

  it('sets the element attributes correctly', () => {
    const result = <h1 foo="bar" />;
    expect(result.getAttribute('foo')).toBe('bar');
  });

  it('appends its children correctly', () => {
    const result =(
      <h1>
        <span />
        <span />
      </h1>
    );
    expect(result.innerHTML).toBe('<span></span><span></span>');
  });

  it('renders svg element correctly', () => {
    const result = buildNode.svg(0)('svg', {},
      buildNode.svg(0)('circle', { cx: 50, cy:50, r:10, fill:"red" })
    );
    expect(result).toBeInstanceOf(SVGElement);
    expect(result.innerHTML).toBe('<circle cx="50" cy="50" r="10" fill="red"></circle>');
  });
});
