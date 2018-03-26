import winston from 'winston';
import Authenticator from '../../src/ldap/authenticator';
import Client from '../../src/ldap/client';
jest.mock('../../src/ldap/client');

const fixtures = {
  username: 'john.doe',
  password: 'secret',
  groups: [
    'cn=test,dc=example,dc=com',
  ],
  attributeNames: [
    'uid',
    'memberOf',
  ],
};

let client = new Client();
const authenticator = new Authenticator(client, '', winston);

beforeEach(() => {
  client.bindSuccess = true;
  client.searchResult = {
    uid: fixtures.username,
    memberOf: fixtures.groups,
    someAttribute: 'someValue',
  };
  client.searchShouldReject = false;
});

describe('Authenticator.authenticate()', () => {
  test('Returns true on valid user', () => {
    expect.hasAssertions();
    return expect(
      authenticator.authenticate(fixtures.username, fixtures.password)
    ).resolves.toBe(true);
  });

  test('Returns false on invalid user', () => {
    client.bindSuccess = false;

    expect.hasAssertions();
    return expect(
      authenticator.authenticate(fixtures.username, fixtures.password)
    ).resolves.toBe(false);
  });
});

describe('Authenticator.getAttributes()', () => {
  test('Returns user object', () => {
    expect.hasAssertions();
    return expect(
      authenticator.getAttributes(fixtures.username, fixtures.attributeNames)
    ).resolves.toEqual({
      uid: fixtures.username,
      memberOf: fixtures.groups,
    });
  });

  test('Rejects on internal error (e.g. ldap error)', () => {
    client.searchShouldReject = true;

    expect.hasAssertions();
    return expect(
      authenticator.getAttributes(fixtures.username, fixtures.attributeNames)
    ).rejects.toMatch('rejected by mock');
  });
});
