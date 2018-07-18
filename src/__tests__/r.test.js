import r from '../r'; // eslint-disable-line
import Structure from '../r/Structure'; // eslint-disable-line
import isComponent from '../component/utils/isComponent'; // eslint-disable-line

/** @jsx r * */
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
    // const html = result.render();
    expect(result).toBeInstanceOf(Structure);
    expect(isComponent(result.query)).toEqual(true);
    expect(result.$compChildren[0].props).toEqual('baz');
    expect(result.props.foo).toBe('bar');
  });

  it('works correctly for functional components', () => {
    const Component = ({ foo, children }) => (<h1 foo={foo}>{children}</h1>);
    const result = (
      <Component foo="bar">
        <span />
        <span />
      </Component>
    );
    expect(result).toBeInstanceOf(Structure);
    expect(result.props.foo).toBe('bar');
    expect(result.children[0].query).toBe('span');
    expect(result.children[1].query).toBe('span');
  });

  it('works correctly for normal elements', () => {
    const result = (<h1 />);
    expect(result).toBeInstanceOf(Structure);
    expect(result.query).toBe('h1');
  });

  it('sets the element attributes correctly', () => {
    const result = (<h1 foo="bar" />);
    expect(result.props.foo).toBe('bar');
  });

  it('appends its children correctly', () => {
    const result = (
      <h1>
        <span />
        <span />
      </h1>
    );
    expect(result.children[0].query).toBe('span');
    expect(result.children[1].query).toBe('span');
  });
});
