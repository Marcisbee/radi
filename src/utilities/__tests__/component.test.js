import component from '../component';
import r from '../r';

/** @jsx r **/
describe('component.js', () => {
  it('works without crashing', () => {
    const TestComponent = component({
      view: function() {
        // Test ()
        return <h1>hey { l(this.sample) }</h1>;
      },
      state: {
        sample: 'World'
      }
    });
    // THE TEST BELOW ONLY PASSES WHEN let _r = {r}; is addded at L45:48 in
    // Radi.js (due to compiling).
    console.log(new TestComponent().__radi().$render().childNodes[0])
  });
});
