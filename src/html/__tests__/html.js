import { html } from '../html'; // eslint-disable-line
// import Structure from '../r/Structure'; // eslint-disable-line
// import isComponent from '../component/utils/isComponent'; // eslint-disable-line

/** @jsx html **/
describe('r.js', () => {
  it('returns plain object', () => {
    expect(<div></div>).toEqual({ children: [], props: {}, type: 'div' });
  });

  it('returns transforms number to string', () => {
    expect(html(2)).toEqual({ children: [], props: {}, type: '2' });
  });

  describe('when promise', () => {
    const MyPromise = new Promise(e => e());

    it('returns `await` as `type`', () => {
      expect(<MyPromise />).toEqual({
        children: [],
        props: {
          src: MyPromise,
        },
        type: 'await',
      });
    });
  });

  describe('when component', () => {
    function App() {
      return;
    }

    it('returns function as `type`', () => {
      expect(<App />).toEqual({ children: [], props: {}, type: App });
    });

    it('returns `props`', () => {
      expect(<App foo="bar" />).toEqual({
        children: [],
        props: {
          foo: 'bar',
        },
        type: App,
      });
    });

    it('returns `children`', () => {
      expect(<App>Foo<div></div></App>).toEqual({
        children: [
          'Foo',
          { children: [], props: {}, type: 'div' },
        ],
        props: {},
        type: App,
      });
    });

    it('returns flattened `children`', () => {
      expect(<App>{[[['Foo']], ['Bar']]}</App>).toEqual({
        children: [
          'Foo',
          'Bar',
        ],
        props: {},
        type: App,
      });
    });
  });

  // it('works correctly for components', () => {
  //   class FakeComponent {
  //     constructor(children) {
  //       this.children = children;
  //       this.props = {};
  //     }

  //     setProps(props) {
  //       this.props = props;
  //       return this;
  //     }

  //     static isComponent() {
  //       return true;
  //     }
  //   }

  //   const result = <FakeComponent foo="bar">baz</FakeComponent>;
  //   // const html = result.render();
  //   expect(result).toBeInstanceOf(Structure);
  //   expect(isComponent(result.query)).toEqual(true);
  //   expect(result.$compChildren[0].props).toEqual('baz');
  //   expect(result.props.foo).toBe('bar');
  // });

  // it('works correctly for functional components', () => {
  //   const Component = ({ foo, children }) => (<h1 foo={foo}>{children}</h1>);
  //   const result = (
  //     <Component foo="bar">
  //       <span />
  //       <span />
  //     </Component>
  //   );
  //   expect(result).toBeInstanceOf(Structure);
  //   expect(result.props.foo).toBe('bar');
  //   expect(result.children[0].query).toBe('span');
  //   expect(result.children[1].query).toBe('span');
  // });

  // it('works correctly for normal elements', () => {
  //   const result = (<h1 />);
  //   expect(result).toBeInstanceOf(Structure);
  //   expect(result.query).toBe('h1');
  // });

  // it('sets the element attributes correctly', () => {
  //   const result = (<h1 foo="bar" />);
  //   expect(result.props.foo).toBe('bar');
  // });

  // it('appends its children correctly', () => {
  //   const result = (
  //     <h1>
  //       <span />
  //       <span />
  //     </h1>
  //   );
  //   expect(result.children[0].query).toBe('span');
  //   expect(result.children[1].query).toBe('span');
  // });
});
