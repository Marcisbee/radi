import { component } from '../component';

describe('component.js', () => {
  it('works without crashing', () => {
    const testComponent = component({
      view: function() {
        // Test ()
        return l(this.sample);
      },
      state: {
        sample: 'World'
      }
    });
  });
});
