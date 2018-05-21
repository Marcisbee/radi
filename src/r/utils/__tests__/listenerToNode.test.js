import listenerToNode from '../listenerToNode';

describe('listenerToNode.js', () => {
  it('returns the value as an array of nodes', () => {
    expect(listenerToNode(4)[0]).toEqual(document.createTextNode(4));
    expect(listenerToNode(['foo', 'bar'])).toEqual([
      document.createTextNode('foo'),
      document.createTextNode('bar'),
    ]);
  });

  test('if its value is a document fragment it returns the children of that document fragment', () => {
    const fragment = document.createDocumentFragment();
    const foo = document.createTextNode('foo');
    const bar = document.createTextNode('bar');
    fragment.appendChild(foo);
    fragment.appendChild(bar);
    expect(listenerToNode(fragment)).toEqual([foo, bar]);
    expect(listenerToNode(fragment)[0]).toBe(foo);
    expect(listenerToNode(fragment)[1]).toBe(bar);
  });
});
