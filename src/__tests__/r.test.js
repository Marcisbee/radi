import r from '../r';

/** @jsx r **/
describe('r.js', () => {
  it('works correctly for components', () => {
    class FakeComponent {
      constructor(children) {
        this.children = children;
        this.props = {};
      }

      setProps(props) {
        this.props = props;
        return this;
      }

      static isComponent() {
        return true;
      }
    }

    const result = <FakeComponent foo="bar">baz</FakeComponent>;
    expect(result).toBeInstanceOf(FakeComponent);
    expect(result.children[0]).toEqual('baz');
    expect(result.props.foo).toBe('bar');
  });

  it('works correctly for functional components', () => {
    const Component = ({ foo, children }) => <h1 foo={foo}>{children}</h1>;
    const result = (
      <Component foo="bar">
        <span />
        <span />
      </Component>
    );
    expect(result).toBeInstanceOf(HTMLHeadingElement);
    expect(result.getAttribute('foo')).toBe('bar');
    expect(result.innerHTML).toBe('<span></span><span></span>');
  });

  it('works correctly for normal elements', () => {
    const result = <h1 />;
    expect(result).toBeInstanceOf(HTMLHeadingElement);
  });

  it('sets the element attributes correctly', () => {
    const result = <h1 foo="bar" />;
    expect(result.getAttribute('foo')).toBe('bar');
  });

  it('appends its children correctly', () => {
    const result = (
      <h1>
        <span />
        <span />
      </h1>
    );
    expect(result.innerHTML).toBe('<span></span><span></span>');
  });
});
