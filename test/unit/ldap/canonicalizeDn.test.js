import {canonicalizeDn} from '../../../src/ldap';

const fixtures = {
  validDn1: 'cn=test,dc=example,dc=com',
  validDn2: 'dc=com',
  invalidDn1: 'test,dc=example,dc=com',
  invalidDn2: 'test',
};

describe('canonicalizeDn()', () => {
  test('Returns canonicalized on valid DNs', () => {
    expect(canonicalizeDn(fixtures.validDn1)).toBe('test');
    expect(canonicalizeDn(fixtures.validDn2)).toBe('com');
  });

  test('Throws error on invalid DNs', () => {
    expect(() => {
      canonicalizeDn(fixtures.invalidDn1)
    }).toThrowError('invalid dn');
    expect(() => {
      canonicalizeDn(fixtures.invalidDn2)
    }).toThrowError('invalid dn');
  });
});
