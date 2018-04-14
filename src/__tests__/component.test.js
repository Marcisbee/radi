import GLOBALS from '../consts/GLOBALS';
import Component from '../component/Component';
import r from '../r'; // eslint-disable-line
import l from '../listen';

afterEach(() => {
  GLOBALS.ACTIVE_COMPONENTS = {};
});

/** @jsx r * */
describe('component.js', () => {
  // This is more of an integration test really
  test('the full component API works', () => {
    class Title extends Component {
      view() {
        return <h1>{this.children}</h1>;
      }
    }

    const Text = ({ color, children }) => (
      <p style={{ color }}>
        {children}
      </p>
    );

    class TestComponent extends Component {
      state() {
        return {
          sample: 'World',
          bar: 'baz',
          style: { color: 'green', width: 200 },
        };
      }

      setSample() {
        return {
          sample: 'New World!',
        };
      }

      setFoo() {
        return {
          bar: 'foo',
        };
      }

      setStyles() {
        return {
          style: {
            color: 'orange',
            width: 400,
          },
        };
      }

      view() {
        return (
          <h1>
            hey {l(this, 'sample')}
            <Title>{l(this, 'sample')}</Title>
            <Text color="purple">
              Foo Bar: {l(this, 'sample')}
            </Text>
            <div>
              {l(this, 'sample').process(value => `${value}!!`)}
            </div>
            <div>
              {l(this, 'sample').process(
                value => (value === 'World' ? <div>A</div> : <div>B</div>)
              )}
            </div>
            <div>
              {l(this, 'sample').process(value =>
                value.split('').map(char => <span>{char}</span>)
              )}
            </div>
            <span foo={l(this, 'bar')} />
            <div style={l(this, 'style')} />
          </h1>
        );
      }
    }

    const c = new TestComponent();
    expect(c.render().innerHTML).toBe(
      'hey World' +
      '<h1>World</h1>' +
      '<p style="color: purple;">Foo Bar: World</p>' +
      '<div>World!!</div>' +
      '<div><div>A</div></div>' +
      '<div>' +
        '<span>W</span>' +
        '<span>o</span>' +
        '<span>r</span>' +
        '<span>l</span>' +
        '<span>d</span>' +
      '</div>' +
      '<span foo="baz"></span>' +
      '<div style="color: green; width: 200px;"></div>'
    );
    c.setState(c.setSample());
    c.setState(c.setFoo());
    c.setState(c.setStyles());
    expect(c.render().innerHTML).toBe(
      'hey New World!' +
      '<h1>New World!</h1>' +
      '<p style="color: purple;">Foo Bar: New World!</p>' +
      '<div>New World!!!</div>' +
      '<div><div>B</div></div>' +
      '<div>' +
        '<span>N</span>' +
        '<span>e</span>' +
        '<span>w</span>' +
        '<span> </span>' +
        '<span>W</span>' +
        '<span>o</span>' +
        '<span>r</span>' +
        '<span>l</span>' +
        '<span>d</span>' +
        '<span>!</span>' +
      '</div>' +
      '<span foo="foo"></span>' +
      '<div style="color: orange; width: 400px;"></div>'
    );
  });

  it('prepares the component class for instantiating', () => {
    class TestComponent extends Component {
      view() {
        return document.createElement('h1');
      }
    }
    expect(TestComponent.isComponent()).toBe(true);
    const instance = new TestComponent([1, 2, 3]);
    expect(instance).toBeInstanceOf(Component);
    expect(instance.view()).toBeInstanceOf(HTMLHeadingElement);
    expect(instance.children).toEqual([1, 2, 3]);
  });
});
