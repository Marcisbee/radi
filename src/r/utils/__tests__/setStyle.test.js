import setStyle from '../setStyle';

describe('setStyle.js', () => {
  it('it sets the style correctly', () => {
    const element = { style: {} };
    const result = setStyle(element, 'color', 'green');
    expect(result).toBe('green');
    expect(element.style.color).toBe('green');
    const result2 = setStyle(element, 'width', 200);
    expect(result2).toBe('200px');
    expect(element.style.width).toBe('200px');
  });

  it('doesn\'t do anything when its value is undefined', () => {
    const element = { style: {} };
    const result = setStyle(element, 'color');
    expect(result).toBeUndefined();
    expect(element.style.color).toBeUndefined();
  });
});
