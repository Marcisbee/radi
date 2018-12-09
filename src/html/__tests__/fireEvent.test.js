import { fireEvent } from '../fireEvent';

describe('fireEvent.js', () => {
  let element;
  let mockEvent;

  beforeEach(() => {
    element = document.createElement('div');
    mockEvent = jest.fn();
  });

  it('calls event correctly', () => {
    element.addEventListener('foo', mockEvent);
    fireEvent('foo', element);
    expect(mockEvent).toHaveBeenCalledTimes(1);
    expect(mockEvent.mock.calls[0][0].toString()).toEqual('[object Event]');
  });
});
