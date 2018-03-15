import GLOBALS from '../consts/GLOBALS';
import component from '../component';
import Component from '../component/Component';
import r from '../r';
import l from '../listen';

afterEach(() => {
  GLOBALS.ACTIVE_COMPONENTS = {};
});

/** @jsx r **/
describe('component.js', () => {
  // This is more of an integration test really
  test('the full component API works', () => {
    const Title = component({
      view: (component) => {
        return <h1>{component.children}</h1>;
      }
    });

    const Text = ({ color, children }) => (
      <p style={{ color }}>
        {children}
      </p>
    );

    const TestComponent = component({
      view: (component) => {
        // Test ()
        return (
          <h1>
            hey {l(component, 'sample')}
            <Title>{l(component, 'sample')}</Title>
            <Text color="purple">
              Foo Bar: {l(component, 'sample')}
            </Text>
            <div>
              {l(component, 'sample').process(value => value + '!!')}
            </div>
            <div>
              {l(component, 'sample').process(
                value => (value === 'World' ? <div>A</div> : <div>B</div>)
              )}
            </div>
            <div>
              {l(component, 'sample').process(value =>
                value.split('').map(char => <span>{char}</span>)
              )}
            </div>
            <span foo={l(component, 'bar')} />
            <div style={l(component, 'style')} />
          </h1>
        );
      },
      state: {
        sample: 'World',
        bar: 'baz',
        style: { color: 'green', width: 200 },
      },
      actions: {
        setSample() { this.sample = 'New World!' },
        setFoo() { this.bar = 'foo' },
        setStyles() { this.style = { color: 'orange', width: 400 } },
      }
    });
    const c = new TestComponent();
    expect(c.render().childNodes[0].innerHTML).toBe(
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
    c.setSample();
    c.setFoo();
    c.setStyles();
    expect(c.render().childNodes[0].innerHTML).toBe(
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
    const TestComponent = component({ view: () => document.createElement('h1') });
    expect(TestComponent.isComponent()).toBe(true);
    const instance = new TestComponent([1, 2, 3]);
    expect(instance).toBeInstanceOf(Component);
    expect(instance.$view).toBeInstanceOf(HTMLHeadingElement);
    expect(instance.children).toEqual([1, 2, 3]);
  });
});
