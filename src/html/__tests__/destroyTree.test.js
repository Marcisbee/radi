import { fireEvent } from '../fireEvent';
import { destroyTree } from '../destroyTree';

jest.mock('../fireEvent');

describe('destroyTree.js', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('div');
    element.__radiRef = {};
    jest.clearAllMocks();
  });

  it('removes __radiRef from node correctly', () => {
    destroyTree(element);
    expect(element.__radiRef).toBeUndefined();
  });

  it('removes __radiRef from nested node correctly', () => {
    const child1 = document.createElement('div');
    const child2 = document.createTextNode('foo');
    child1.__radiRef = {};
    child2.__radiRef = {};
    element.appendChild(child1);
    element.appendChild(child2);
    destroyTree(element);
    expect(child1.__radiRef).toBeUndefined();
    expect(child2.__radiRef).toBeUndefined();
  });

  it('calls fireEvent correctly', () => {
    destroyTree(element);
    expect(fireEvent).toBeCalledTimes(1);
    expect(fireEvent).toHaveBeenCalledWith('destroy', element);
  });

  it('calls fireEvent with nested node correctly', () => {
    const child1 = document.createElement('div');
    const child2 = document.createTextNode('foo');
    element.appendChild(child1);
    element.appendChild(child2);
    destroyTree(element);
    expect(fireEvent).toBeCalledTimes(3);
    expect(fireEvent).toHaveBeenCalledWith('destroy', element);
    expect(fireEvent).toHaveBeenCalledWith('destroy', child1);
    expect(fireEvent).toHaveBeenCalledWith('destroy', child2);
  });
});
