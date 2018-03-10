import setStyle from '../setStyle';

describe('setStyle.js', () => {
  //it('works when arg2 is watchable', () => {
    // TODO: Not really testable
  //});

  it('sets the arg1 style property of view to arg2', () => {
    const view = document.createElement('div');
    setStyle(view, 'color', 'green');
    expect(view.style.color).toBe('green');
  });

  it('sets the style attribute of view to arg1 when arg1 is a string', () => {
    const view = document.createElement('div');
    setStyle(view, 'color: green;');
    expect(view.style.color).toBe('green');
  });

  // TODO: Add test for else block that I can't really test right now because
  // it's too unclear
});
