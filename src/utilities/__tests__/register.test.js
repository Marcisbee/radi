import sinon from 'sinon';
import GLOBALS from '../../consts/GLOBALS';
import register from '../register';

afterAll(() => {
  GLOBALS.REGISTERED = [];
});

describe('register.js', () => {
  it('registers given component', () => {
    const constructorSpy = sinon.spy();
    class FakeComponent {
      constructor() {
        constructorSpy();
        this.o = {
          name: 'test'
        };
      }
    }

    register(FakeComponent);
    expect(GLOBALS.REGISTERED.test.name).toBe('FakeComponent');
    expect(Object.keys(GLOBALS.REGISTERED)).toHaveLength(1);
    expect(constructorSpy.calledOnce).toBe(true);

    const constructorSpyTwo = sinon.spy();
    class FakeComponentTwo {
      constructor() {
        constructorSpyTwo();
        this.o = {
          name: 'test'
        };
      }
    }

    register(FakeComponentTwo);
    expect(GLOBALS.REGISTERED.test.name).toBe('FakeComponentTwo');
    expect(Object.keys(GLOBALS.REGISTERED)).toHaveLength(1);
    expect(constructorSpyTwo.calledOnce).toBe(true);

    const constructorSpyThree = sinon.spy();
    class FakeComponentThree {
      constructor() {
        constructorSpyThree();
        this.o = {
          name: null
        };
      }
    }

    register(FakeComponentThree);
    expect(Object.keys(GLOBALS.REGISTERED)).toHaveLength(1);
    expect(constructorSpyThree.calledOnce).toBe(true);
  });
});
