import component from '../component';
import r from '../r';
import l from '../l';

/** @jsx r **/
describe('component.js', () => {
  it('works without crashing', async () => {
    const Title = component({
      view: (component) => {
        return <h1>{component.children}</h1>;
      }
    });

    const TestComponent = component({
      view: (component) => {
        // Test ()
        return (
          <h1>
            hey { l(component, 'sample') }
            <Title>{l(component, 'sample')}</Title>
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
    console.log(c.render().childNodes[0].innerHTML);
    expect(c.render().childNodes[0].innerHTML).toBe(
      'hey World' +
      '<h1>World</h1>' +
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
    console.log(c.render().childNodes[0].innerHTML);
    expect(c.render().childNodes[0].innerHTML).toBe(
      'hey New World!' +
      '<h1>New World!</h1>' +
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
});
