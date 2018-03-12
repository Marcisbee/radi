import component from '../component';
import r from '../r';
import l from '../l';

/** @jsx r **/
describe('component.js', () => {
  it('works without crashing', async () => {
    const Title = component({
      view: (component) => {
        return <h1>{l(component, 'children')}sd{component.children}</h1>;
      }
    });

    const TestComponent = component({
      view: (component) => {
        // Test ()
        return (
          <h1>
            hey { l(component, 'sample') }
            <Title>{l(component, 'sample')}</Title>
            <span foo={l(component, 'bar')} />
          </h1>
        );
      },
      state: {
        sample: 'World',
        bar: 'baz'
      },
      actions: {
        setSample() { this.sample = 'New World!' },
        setFoo() { this.bar = 'foo' },
      }
    });
    const c = new TestComponent();
    console.log(c.render().childNodes[0].innerHTML);
    expect(c.render().childNodes[0].innerHTML).toBe('hey World<h1>WorldsdWorld</h1><span foo="baz"></span>');
    c.setSample();
    c.setFoo();
    console.log(c.render().childNodes[0].innerHTML);
    expect(c.render().childNodes[0].innerHTML).toBe('hey New World!<h1>New World!sdWorld</h1><span foo="foo"></span>');
  });
});
