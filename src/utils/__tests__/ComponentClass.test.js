import Component from '../ComponentClass';
import r from '../../r';

/** @jsx r **/
describe('ComponentClass.js', () => {
  it('can be instantiated', () => {
    expect(new Component({
      name: 'foo',
      state: {},
      props: {},
      actions: {},
      view: {},
      $view: {}
    })).toBeDefined();
  });

  it('derives its fields from given parameter', () => {
    const component = new Component({
      name: 'foo',
      state: { foo: 'bar' },
      props: { bar: 'foo' },
      actions: { baz: 'foo' },
      view: <h1>Hello</h1>,
    });

    expect(component.o.name).toBe('foo');
    expect(component.o.state).toEqual({ foo: 'bar' });
    expect(component.o.props).toEqual({ bar: 'foo' });
    expect(component.o.actions).toEqual({ baz: 'foo' });
    expect(component.o.view).toEqual(<h1>Hello</h1>);
  });

  it('adds a __radi method', () => {
    expect(typeof new Component({
      name: 'foo',
      state: {},
      props: {},
      actions: {},
      view: <h1>Hello World!</h1>,
    }).__radi).toBe('function');
  });

  it('has a props method that updates/adds the given props', () => {
    const component = new Component({
      name: 'foo',
      state: { foo: 'bar' },
      props: { foo: 'bar', bar: 'foo' },
      actions: { baz: 'foo' },
      view: <h1>Hello World!</h1>,
    });
    component.props({
      bar: 'baz',
      a: 'b'
    });
    expect(component.o.props).toEqual({
      foo: 'bar',
      bar: 'baz',
      a: 'b'
    });
  });

  it('has a $mixins field', () => {
    expect(new Component({
      name: 'foo',
      state: {},
      props: {},
      actions: {},
      view: <h1>Hello World!</h1>,
    }).$mixins).toEqual({});
  });
});
