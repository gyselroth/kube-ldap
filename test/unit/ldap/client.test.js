import Client from '../../../src/ldap/client';
import {Client as Connection} from 'ldapts';

const fixtures = {
  basedn: 'dc=example,dc=com',
  binddn: 'uid=bind,dc=example,dc=com',
  bindpw: 'secret',
  username: 'john.doe',
  dn: 'uid=john.doe,dc=example,dc=com',
  password: 'secret',
  groups: [
    'cn=test,dc=example,dc=com',
  ],
  filter: '(uid=john.doe)',
  attributeNames: [
    'uid',
    'memberOf',
  ],
};

let connection = new Connection();
let connectionFactory = () => {
  return connection;
};
let client = null;

beforeEach(() => {
  connection.starttlsReturnsError = false;
  connection.bindReturnsError = false;
  connection.searchReturnsError = false;
  connection.searchEmitsError = false;
  connection.searchEmitsResult = true;
  connection.searchEmitsEndStatus = 0;
  connection.searchResult = {
    uid: fixtures.username,
    memberOf: fixtures.groups,
  };
  client = new Client(
    connectionFactory,
    fixtures.basedn,
    fixtures.binddn,
    fixtures.bindpw,
    true
  );
});

describe('Client.bind()', () => {
  test('Resolves to true for successful bind', () => {
    expect.hasAssertions();
    return expect(
      client.bind(fixtures.dn, fixtures.password)
    ).resolves.toBe(true);
  });

  test('Resolves to false for unsuccessful bind', () => {
    connection.bindReturnsError = true;

    expect.hasAssertions();
    return expect(
      client.bind(fixtures.dn, fixtures.password)
    ).resolves.toBe(false);
  });
});

describe('Client.search()', () => {
  test('Rejects on bind error', () => {
    connection.bindReturnsError = true;

    expect.hasAssertions();
    return expect(
      client.search(fixtures.filter)
    ).rejects.toEqual(new Error('error by mock'));
  });

  test('Rejects on search error', () => {
    connection.searchReturnsError = true;

    expect.hasAssertions();
    return expect(
      client.search(fixtures.filter)
    ).rejects.toEqual(new Error('error by mock'));
  });

  test('Rejects on empty result', () => {
    connection.searchReturnsResult = false;

    expect.hasAssertions();
    return expect(
      client.search(fixtures.filter)
    ).rejects.toEqual(new Error(
      `no object found with filter [${fixtures.filter}]`
    ));
  });
});
