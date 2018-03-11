import component from '../component';
import r from '../r';
import l from '../l';

/** @jsx r **/
describe('component.js', () => {
  it('works without crashing', () => {
    const TestComponent = component({
      view: function(component) {
        // Test ()
        return <h1>hey { l(component, 'sample') }</h1>;
      },
      state: {
        sample: 'World'
      },
      actions: {
        setSample() { this.sample = 'New World!' }
      }
    });
    const c = new TestComponent();
    console.log(c.$render().childNodes[0].innerHTML);
    c.setSample();
    console.log(c.$render().childNodes[0].innerHTML);
  });
});
