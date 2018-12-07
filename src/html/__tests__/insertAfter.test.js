import { insertAfter } from '../insertAfter';

describe('insertAfter.js', () => {
  it('inserts element correctly', () => {
    const child = document.createElement('i');
    child.innerHTML = 1;
    const subject = document.createElement('i');
    subject.innerHTML = 2;
    const temp = document.createElement('i');
    temp.innerHTML = 3;
    const parent = document.createElement('div');
    parent.appendChild(child);
    parent.appendChild(temp);
    const aftered = insertAfter(subject, child, parent);
    expect(aftered).toBe(subject);
    expect(parent.innerHTML).toBe('<i>1</i><i>2</i><i>3</i>');
  });
});
