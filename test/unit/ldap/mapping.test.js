import Mapping from '../../../src/ldap/mapping';

const fixtures = {
  mapping: {
    username: 'mail',
    uid: 'cn',
    groups: 'memberOf',
    extraFields: [
      'uidNumber',
      'gidNumber',
    ],
  },
  attributes: [
    'mail', 'cn', 'memberOf', 'uidNumber', 'gidNumber',
  ],
  ldapObject: {
    mail: 'john.doe@example.com',
    cn: 'john.doe',
    memberOf: [
      'cn=kubernetes,ou=groups,dc=example,dc=com',
      'cn=user,ou=groups,dc=example,dc=com',
    ],
    uidNumber: 1,
    gidNumber: [10, 11],
  },
  kubernetesObject: {
    username: 'john.doe@example.com',
    uid: 'john.doe',
    groups: [
      'kubernetes',
      'user',
    ],
    extra: {
      'uidNumber': 1,
      'gidNumber': [10, 11],
    },
  },
};

describe('Mapping.getLdapAttributes()', () => {
  test('returns array of all attributes', () => {
    let mapping = new Mapping(
      fixtures.mapping.username,
      fixtures.mapping.uid,
      fixtures.mapping.groups,
      fixtures.mapping.extraFields
    );

    expect(mapping.getLdapAttributes()).toEqual(fixtures.attributes);
  });

  test('returns array of all attributes if extraFields was empty', () => {
    let mapping = new Mapping(
      fixtures.mapping.username,
      fixtures.mapping.uid,
      fixtures.mapping.groups,
      []
    );

    expect(mapping.getLdapAttributes()).toEqual(
      fixtures.attributes.splice(0, 3)
    );
  });
});

describe('Mapping.ldapToKubernetes()', () => {
  test('returns mapped object with attributes', () => {
    let mapping = new Mapping(
      fixtures.mapping.username,
      fixtures.mapping.uid,
      fixtures.mapping.groups,
      fixtures.mapping.extraFields
    );

    expect(
      mapping.ldapToKubernetes(fixtures.ldapObject)
    ).toEqual(fixtures.kubernetesObject);
  });
});
