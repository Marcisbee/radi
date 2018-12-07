import { Component } from '../Component';

describe('Component.js', () => {
  function fakeComponent() {}
  let fakeNode;

  beforeEach(() => {
    fakeNode = {
      type: fakeComponent,
      pointer: () => {},
      update: () => {},
    };
  });

  test('its type property is set correctly', () => {
    const component = new Component(fakeNode);
    expect(component.type).toBe(fakeComponent);
  });

  test('its name property is set correctly', () => {
    const component = new Component(fakeNode);
    expect(component.name).toBe('fakeComponent');
  });

  test('its pointer property is set correctly', () => {
    const component = new Component(fakeNode);
    expect(component.pointer).toBe(fakeNode.pointer);
  });

  test('its update property is set correctly', () => {
    const component = new Component(fakeNode);
    expect(component.update).toBe(fakeNode.update);
  });

  test('its __$events property is set correctly', () => {
    const component = new Component(fakeNode);
    expect(component.__$events).toEqual({});
  });

  test('its on method works correctly', () => {
    const fakeEvent = () => {};
    const component = new Component(fakeNode);
    component.on('mount', fakeEvent);
    expect(component.__$events).toHaveProperty('onMount');
    expect(component.__$events).toEqual({
      onMount: [fakeEvent],
    });
  });

  test('its trigger method works correctly', () => {
    const fakeEvent = jest.fn();
    const component = new Component(fakeNode);
    component.__$events = {
      onMount: [fakeEvent],
    };
    component.trigger('mount', 1, 2, 3);
    expect(fakeEvent).toBeCalledTimes(1);
    expect(fakeEvent).toHaveBeenCalledWith(1, 2, 3);
  });
});
