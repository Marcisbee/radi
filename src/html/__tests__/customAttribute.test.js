import GLOBALS from '../../consts/GLOBALS';
import { customAttribute } from '../customAttribute';

describe('customAttribute.js', () => {
  it('sets global value correctly', () => {
    const method = () => {};
    customAttribute('foo', method);
    const output = GLOBALS.CUSTOM_ATTRIBUTES;
    expect(output).toHaveProperty('foo');
    expect(output.foo).toEqual({
      name: 'foo',
      caller: method,
      allowedTags: null,
      addToElement: undefined,
    });
  });

  it('calls sets empty allowedTags correctly', () => {
    const method = () => {};
    const config = { allowedTags: [] };
    customAttribute('foo', method, config);
    const output = GLOBALS.CUSTOM_ATTRIBUTES.foo;
    expect(output.allowedTags).toEqual([]);
  });

  it('calls sets allowedTags correctly', () => {
    const method = () => {};
    const config = { allowedTags: ['div', 'span'] };
    customAttribute('foo', method, config);
    const output = GLOBALS.CUSTOM_ATTRIBUTES.foo;
    expect(output.allowedTags).toEqual(['div', 'span']);
  });

  it('calls sets addToElement correctly', () => {
    const method = () => {};
    const config = { addToElement: true };
    customAttribute('foo', method, config);
    const output = GLOBALS.CUSTOM_ATTRIBUTES.foo;
    expect(output.addToElement).toEqual(true);
  });
});
