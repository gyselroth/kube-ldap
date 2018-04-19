import winston from 'winston';
import {getResponseMock, getRequestMock} from '../mock';
import jwt from 'jsonwebtoken';
import UserAuthentication from '../../src/api/userAuthentication';
import {Authenticator, Mapping} from '../../src/ldap';
jest.mock('../../src/ldap/authenticator');

const fixtures = {
  key: 'testsecret',
  lifetime: 3600,
  username: 'john.doe',
  password: 'secret',
  authHeader: 'Basic am9obi5kb2U6c2VjcmV0',
  groups: [
    'test',
  ],
  extraFields: {
    uidNumber: 1,
    gidNumber: 10,
  },
  mapping: new Mapping(
    'uid',
    'uid',
    'memberOf',
    [
      'uidNumber',
      'gidNumber',
    ]
  ),
};

let authenticator = new Authenticator();
const userAuthentication = new UserAuthentication(
  authenticator,
  fixtures.lifetime,
  fixtures.key,
  fixtures.mapping,
  winston);

beforeEach(() => {
  authenticator.authenticated = true;
  authenticator.attributes = {
    uid: fixtures.username,
    memberOf: fixtures.groups.map((group) => {
      return 'cn=' + group + ',dc=example,dc=com';
    }),
    uidNumber: fixtures.extraFields.uidNumber,
    gidNumber: fixtures.extraFields.gidNumber,
  };
  authenticator.getAttributesShouldThrowError = false;
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
      expect(token.payload.uid).toBe(fixtures.username);
      expect(token.payload.groups).toEqual(fixtures.groups);
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
      expect(responseMock.sendStatus).toHaveBeenCalled();
      expect(responseMock.sendStatus.mock.calls[0][0])
        .toEqual(401);
    });
  });

  test('Sends 401 on missing auth header', () => {
    const requestMock = getRequestMock();
    const responseMock = getResponseMock();

    userAuthentication.run(requestMock, responseMock);

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

  test('Sends 500 on internal server error (e.g. ldap error)', () => {
    authenticator.getAttributesShouldThrowError = true;
    const requestMock = getRequestMock(
      '',
      {'Authorization': fixtures.authHeader}
    );
    const responseMock = getResponseMock();

    return userAuthentication.run(requestMock, responseMock).then(() => {
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
    return userAuthentication.getToken(fixtures.username).then((result) => {
          let token = jwt.decode(result, {complete: true});
          expect(token.header.typ).toBe('JWT');
          expect(token.payload.username).toBe(fixtures.username);
          expect(token.payload.uid).toBe(fixtures.username);
          expect(token.payload.groups).toEqual(fixtures.groups);
          expect(token.payload.extra).toEqual(fixtures.extraFields);
          expect(token.payload.exp / 60).toBeCloseTo((now + fixtures.lifetime) / 60);
          expect(jwt.verify(result, fixtures.key));
    });
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
