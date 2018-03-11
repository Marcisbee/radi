import component from '../component';
import r from '../r';
import l from '../l';

/** @jsx r **/
describe('component.js', () => {
  it('works without crashing', () => {
    const Title = component({
      view: () => <h1>hey</h1>
    });

    const TestComponent = component({
      view: (component) => {
        // Test ()
        return <h1>hey { l(component, 'sample') }<Title /></h1>;
      },
      state: {
        sample: 'World'
      },
      actions: {
        setSample() { this.sample = 'New World!' }
      }
    });
    const c = new TestComponent();
    console.log(c.render().childNodes[0].innerHTML);
    expect(c.render().childNodes[0].innerHTML).toBe('hey World<h1>hey</h1>');
    c.setSample();
    console.log(c.render().childNodes[0].innerHTML);
    expect(c.render().childNodes[0].innerHTML).toBe('hey New World!<h1>hey</h1>');
  });
});
