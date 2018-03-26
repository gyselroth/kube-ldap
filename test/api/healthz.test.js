import Healthz from '../../src/api/healthz';

describe('Healthz.run()', () => {
  test('Sends "OK"', () => {
    let healthz = new Healthz();
    const responseMock = {
      send: jest.fn(),
    };
    healthz.run({}, responseMock);
    expect(responseMock.send).toHaveBeenCalled();
    expect(responseMock.send.mock.calls[0][0]).toBe('OK');
  });
});
