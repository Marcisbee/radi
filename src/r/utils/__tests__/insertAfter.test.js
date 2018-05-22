import insertAfter from '../insertAfter';
import buildNode from '../../buildNode';

/* @jsx buildNode.html */
describe('insertAfter.js', () => {
  it('inserts element correctly', () => {
    const child = <i>1</i>;
    const subject = <i>2</i>;
    const parent = (
      <div>
        {child}
        <i>3</i>
      </div>
    );
    insertAfter(child, subject);
    expect(parent.innerHTML).toBe('<i>1</i><i>2</i><i>3</i>');
  });

  it('returns correct element', () => {
    const child = <i>1</i>;
    const subject = <i>2</i>;
    const parent = (
      <div>
        {child}
      </div>
    );
    const subject2 = insertAfter(child, subject);
    expect(subject).toBe(subject2);
  });
});
