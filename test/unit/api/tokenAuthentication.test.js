 import winston from 'winston';
import {getResponseMock, getRequestMock} from '../mock';
import TokenAuthentication from '../../../src/api/tokenAuthentication';
import {Authenticator, Mapping} from '../../../src/ldap';
jest.mock('../../../src/ldap/authenticator');

const fixtures = {
  key: 'testsecret',
  validToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.ajB221IVz7aggEfTp3jUPc7UBw5xemmp-LmrmEgFETU',
  validTokenPayload: {
    sub: '1234567890',
    name: 'John Doe',
    iat: 1516239022,
  },
  invalidSignatureToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.1VAmegkQOBsQ-iSZU96z6c8NY7QR9OhhYWYHwHTeGT4',
  expiredToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkphbmUgRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE1MTYyOTkwMjJ9.Vuok0UaMvQdtU8wkPIqg_t34OSM6j0cRqFJet4X8xvQ',
  requestTemplate: {
    apiVersion: 'authentication.k8s.io/v1beta1',
    kind: 'TokenReview',
    spec: {
      'token': null,
    },
  },
  notAuthenticatedResponse: {
    apiVersion: 'authentication.k8s.io/v1beta1',
    kind: 'TokenReview',
    status: {
      authenticated: false,
    },
  },
  authenticatedResponseTemplate: {
    apiVersion: 'authentication.k8s.io/v1beta1',
    kind: 'TokenReview',
    status: {
      authenticated: true,
      user: {},
    },
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
  validTokenResponse: {
    username: 'john.doe',
    groups: [
      'test',
    ],
    extra: {
      uidNumber: 1,
      gidNumber: 10,
    },
    uid: 'john.doe',
  },
};

let authenticator = new Authenticator();
const tokenAuthentication = new TokenAuthentication(
  authenticator,
  fixtures.mapping,
  fixtures.key,
  winston
);

const generateRequestBody = (token) => {
  let requestBody = Object.assign({}, fixtures.requestTemplate);
  requestBody.spec.token = token;
  return requestBody;
};

const generateAuthenticatedResponseBody = (payload) => {
  let responseBody = fixtures.authenticatedResponseTemplate;
  responseBody.status.user = payload;
  return responseBody;
};

beforeEach(() => {
  authenticator.authenticated = true;
  authenticator.attributes = {
    uid: fixtures.validTokenResponse.username,
    memberOf: fixtures.validTokenResponse.groups.map((group) => {
      return 'cn=' + group + ',dc=example,dc=com';
    }),
    uidNumber: fixtures.validTokenResponse.extra.uidNumber,
    gidNumber: fixtures.validTokenResponse.extra.gidNumber,
  };
  authenticator.getAttributesShouldThrowError = false;
});

describe('TokenAuthentication.extractAndVerifyToken()', () => {
  test('Returns token content', () => {
    expect(tokenAuthentication.extractAndVerifyToken(fixtures.validToken))
      .toEqual(fixtures.validTokenPayload);
  });

  test('Throws error on token with invalid signature', () => {
    expect(() => {
      tokenAuthentication.extractAndVerifyToken(fixtures.invalidSignatureToken);
    }).toThrow();
  });

  test('Throws error on expired token', () => {
    expect(() => {
      tokenAuthentication.extractAndVerifyToken(fixtures.expiredToken);
    }).toThrow();
  });
});

describe('TokenAuthentication.run()', () => {
  test('Sends token payload on valid token', () => {
    const requestMock = getRequestMock(
      generateRequestBody(fixtures.validToken)
    );
    const responseMock = getResponseMock();

    return tokenAuthentication.run(requestMock, responseMock).then(() => {
      expect(responseMock.send).toHaveBeenCalled();
      expect(responseMock.send.mock.calls[0][0])
        .toEqual(generateAuthenticatedResponseBody(fixtures.validTokenResponse));
    });
  });

  test('Sends "not-authenticated" response on invalid token', () => {
    const requestMock = getRequestMock(
      generateRequestBody(fixtures.invalidSignatureToken)
    );
    const responseMock = getResponseMock();

    return tokenAuthentication.run(requestMock, responseMock).then(() => {
      expect(responseMock.send).toHaveBeenCalled();
      expect(responseMock.send.mock.calls[0][0])
        .toEqual(fixtures.notAuthenticatedResponse);
    });
  });

  test('Sends "not-authenticated" response on invalid token', () => {
    const requestMock = getRequestMock(
      generateRequestBody(fixtures.expiredToken)
    );
    const responseMock = getResponseMock();

    return tokenAuthentication.run(requestMock, responseMock).then(() => {
      expect(responseMock.send).toHaveBeenCalled();
      expect(responseMock.send.mock.calls[0][0])
        .toEqual(fixtures.notAuthenticatedResponse);
    });
  });

  test('Sends 400 response on invalid request', () => {
    const requestMock = getRequestMock('');
    const responseMock = getResponseMock();

    tokenAuthentication.run(requestMock, responseMock);

    expect(responseMock.sendStatus).toHaveBeenCalled();
    expect(responseMock.sendStatus.mock.calls[0][0])
      .toEqual(400);
  });

  test('Sends 400 response on non-TokenReview request', () => {
    let body = generateRequestBody(fixtures.invalidSignatureToken);
    body.kind = 'Something';
    const requestMock = getRequestMock(body);
    const responseMock = getResponseMock();

    tokenAuthentication.run(requestMock, responseMock);

    expect(responseMock.sendStatus).toHaveBeenCalled();
    expect(responseMock.sendStatus.mock.calls[0][0])
      .toEqual(400);
  });

  test('Sends "not-authenticated" on internal server error (e.g. ldap error)', () => {
    authenticator.getAttributesShouldThrowError = true;
    const requestMock = getRequestMock(
      generateRequestBody(fixtures.validToken)
    );
    const responseMock = getResponseMock();

    return tokenAuthentication.run(requestMock, responseMock).then(() => {
      expect(responseMock.send).toHaveBeenCalled();
      expect(responseMock.send.mock.calls[0][0])
        .toEqual(fixtures.notAuthenticatedResponse);
    });
  });
});
