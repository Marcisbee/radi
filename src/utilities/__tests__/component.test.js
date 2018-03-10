import component from '../component';
import r from '../r';
import l from '../l';

/** @jsx r **/
describe('component.js', () => {
  it('works without crashing', () => {
    const TestComponent = component({
      view: function(radi) {
        // Test ()
        return <h1>hey { l(radi, 'sample') }</h1>;
      },
      state: {
        sample: 'World'
      },
      actions: {
        setSample() { this.sample = 'New World!' }
      }
    });
    const radiInstance = new TestComponent().__radi();
    console.log(radiInstance.$render().childNodes[0].innerHTML)
    radiInstance.setSample();
    console.log(radiInstance.$render().childNodes[0].innerHTML)
  });
});
