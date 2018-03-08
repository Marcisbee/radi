import { Component } from '../ComponentClass';

describe("ComponentClass.js", () => {
  it("can be instantiated", () => {
    expect(new Component({
      name: "foo",
      state: {},
      props: {},
      actions: {},
      view: {},
      $view: {}
    })).toBeDefined();
  });

  it("derives its fields from given parameter", () => {
    const component = new Component({
      name: "foo",
      state: { foo: "bar" },
      props: { bar: "foo" },
      actions: { baz: "foo" },
      view: { a: "b" },
      $view: { b: "a" }
    });

    expect(component.o.name).toBe("foo");
    expect(component.o.state).toEqual({ foo: "bar" });
    expect(component.o.props).toEqual({ bar: "foo" });
    expect(component.o.actions).toEqual({ baz: "foo" });
    expect(component.o.view).toEqual({ a: "b" });
    expect(component.o.$view).toEqual({ b: "a" });
  });

  it("adds a __radi method", () => {
    expect(typeof new Component({
      name: "foo",
      state: {},
      props: {},
      actions: {},
      view: {},
      $view: {}
    }).__radi).toBe("function");
  });

  it("has a props method that updates/adds the given props", () => {
    const component = new Component({
      name: "foo",
      state: { foo: "bar" },
      props: { foo: "bar", bar: "foo" },
      actions: { baz: "foo" },
      view: { a: "b" },
      $view: { b: "a" }
    });
    component.props({
      bar: "baz",
      a: "b"
    });
    expect(component.o.props).toEqual({
      foo: "bar",
      bar: "baz",
      a: "b"
    });
  });

  it("has a $mixins field", () => {
    expect(new Component({
      name: "foo",
      state: {},
      props: {},
      actions: {},
      view: {},
      $view: {}
    }).$mixins).toEqual({});
  });
});
