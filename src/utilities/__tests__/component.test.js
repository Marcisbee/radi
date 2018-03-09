import { component } from '../component';

describe('component.js', () => {
  it('works without crashing', () => {
    const testComponent = component({
      view: function() {
        return this.sample;
      },
      state: {
        sample: 'World'
      }
    });
  });
});
