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
      }
    });
    console.log(new TestComponent().__radi().$render().childNodes[0].innerHTML)
  });
});
