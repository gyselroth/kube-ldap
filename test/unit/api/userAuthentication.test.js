import winston from 'winston';
import {getResponseMock, getRequestMock} from '../mock';
import jwt from 'jsonwebtoken';
import UserAuthentication from '../../../src/api/userAuthentication';
import {Authenticator} from '../../../src/ldap';
jest.mock('../../../src/ldap/authenticator');

const fixtures = {
  key: 'testsecret',
  lifetime: 3600,
  username: 'john.doe',
  password: 'secret',
  authHeader: 'Basic am9obi5kb2U6c2VjcmV0',
};

let authenticator = new Authenticator();
const userAuthentication = new UserAuthentication(
  authenticator,
  fixtures.lifetime,
  fixtures.key,
  winston);

beforeEach(() => {
  authenticator.authenticated = true;
});

describe('UserAuthentication.run()', () => {
  test('Sends token on authenticated user', () => {
    const requestMock = getRequestMock(
      '',
      {'Authorization': fixtures.authHeader}
    );
    const responseMock = getResponseMock();

    expect.hasAssertions();
    return userAuthentication.run(requestMock, responseMock).then(() => {
      expect(responseMock.send).toHaveBeenCalled();
      let token = jwt.decode(responseMock.send.mock.calls[0][0], {complete: true});
      expect(token.header.typ).toBe('JWT');
      expect(token.payload.username).toBe(fixtures.username);
    });
  });

  test('Sends 401 on uauthenticated user', () => {
    authenticator.authenticated = false;
    const requestMock = getRequestMock(
      '',
      {'Authorization': fixtures.authHeader}
    );
    const responseMock = getResponseMock();

    expect.hasAssertions();
    return userAuthentication.run(requestMock, responseMock).then(() => {
      expect(responseMock.set).toHaveBeenCalled();
      expect(responseMock.set.mock.calls[0][0])
        .toEqual('WWW-Authenticate', 'Basic realm="kubernetes"');
      expect(responseMock.sendStatus).toHaveBeenCalled();
      expect(responseMock.sendStatus.mock.calls[0][0])
        .toEqual(401);
    });
  });

  test('Sends 401 on missing auth header', () => {
    const requestMock = getRequestMock();
    const responseMock = getResponseMock();

    userAuthentication.run(requestMock, responseMock);
    expect(responseMock.set).toHaveBeenCalled();
    expect(responseMock.set.mock.calls[0][0])
      .toEqual('WWW-Authenticate', 'Basic realm="kubernetes"');
    expect(responseMock.sendStatus).toHaveBeenCalled();
    expect(responseMock.sendStatus.mock.calls[0][0])
      .toEqual(401);
  });

  test('Sends 400 on invalid auth header', () => {
    const requestMock = getRequestMock('', {'Authorization': 'Basic test'});
    const responseMock = getResponseMock();

    userAuthentication.run(requestMock, responseMock);

    expect(responseMock.sendStatus).toHaveBeenCalled();
    expect(responseMock.sendStatus.mock.calls[0][0])
      .toEqual(400);
  });

  test('Sends 400 on not http-basic auth header', () => {
    const requestMock = getRequestMock('', {'Authorization': 'Bearer test'});
    const responseMock = getResponseMock();

    userAuthentication.run(requestMock, responseMock);

    expect(responseMock.sendStatus).toHaveBeenCalled();
    expect(responseMock.sendStatus.mock.calls[0][0])
      .toEqual(400);
  });

  test('Sends 500 on invalid key', () => {
    const requestMock = getRequestMock(
      '',
      {'Authorization': fixtures.authHeader}
    );
    const responseMock = getResponseMock();

    const failingUserAuthentication = new UserAuthentication(
      authenticator,
      fixtures.lifetime,
      undefined,
      winston);

    failingUserAuthentication.run(requestMock, responseMock).then(() => {
      expect(responseMock.sendStatus).toHaveBeenCalled();
      expect(responseMock.sendStatus.mock.calls[0][0])
        .toEqual(500);
    });
  });
});

describe('UserAuthentication.getToken()', () => {
  test('Returns token on valid request', () => {
    let now = Math.floor(new Date() / 1000);

    expect.hasAssertions();
    let result = userAuthentication.getToken(fixtures.username);
    let token = jwt.decode(result, {complete: true});
    expect(token.header.typ).toBe('JWT');
    expect(token.payload.username).toBe(fixtures.username);
    expect(token.payload.exp / 60).toBeCloseTo((now + fixtures.lifetime) / 60);
    expect(jwt.verify(result, fixtures.key));
  });
});

describe('UserAuthentication.parseBasicAuthHeader()', () => {
  test('Throws Error if header is not basic auth', () => {
    expect(() => {
      UserAuthentication.parseBasicAuthHeader('Bearer test');
    }).toThrow();
  });
  test('Throws Error if basic auth header is invalid', () => {
    expect(() => {
      UserAuthentication.parseBasicAuthHeader('Basic test');
    }).toThrow();
  });
  test('Returns user and password from header', () => {
    let result = UserAuthentication.parseBasicAuthHeader(fixtures.authHeader);
    expect(result.username).toBe(fixtures.username);
    expect(result.password).toBe(fixtures.password);
  });
});
