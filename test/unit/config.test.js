import {getConfig} from '../../src/config';

const fixtures = {
  'loglevel': {
    env: 'LOGLEVEL',
    default: 'info',
    testValues: ['debug'],
  },
  'ldap.uri': {
    env: 'LDAP_URI',
    default: 'ldap://ldap.example.com',
    testValues: ['ldap://ldap.example.local'],
  },
  'ldap.bindDn': {
    env: 'LDAP_BINDDN',
    default: 'uid=bind,dc=example,dc=com',
    testValues: ['uid=bind,dc=example,dc=local'],
  },
  'ldap.bindPw': {
    env: 'LDAP_BINDPW',
    default: 'secret',
    testValues: ['topsecret'],
  },
  'ldap.baseDn': {
    env: 'LDAP_BASEDN',
    default: 'dc=example,dc=com',
    testValues: ['dc=example,dc=local'],
  },
  'ldap.filter': {
    env: 'LDAP_FILTER',
    default: '(uid=%s)',
    testValues: ['(mail=%s)'],
  },
  'ldap.timeout': {
    env: 'LDAP_TIMEOUT',
    default: 0,
    testValues: [
      {value: '30', expected: 30},
    ],
  },
  'mapping.username': {
    env: 'MAPPING_USERNAME',
    default: 'uid',
    testValues: ['mail'],
  },
  'mapping.uid': {
    env: 'MAPPING_UID',
    default: 'uid',
    testValues: ['cn'],
  },
  'mapping.groups': {
    env: 'MAPPING_GROUPS',
    default: 'memberOf',
    testValues: ['groups'],
  },
  'mapping.extraFields': {
    env: 'MAPPING_EXTRAFIELDS',
    default: [],
    testValues: [
      {value: 'uidNumber', expected: ['uidNumber']},
      {value: 'uidNumber,gidNumber', expected: ['uidNumber', 'gidNumber']},
    ],
  },
  'jwt.key': {
    env: 'JWT_KEY',
    default: 'secret',
    testValues: ['topsecret'],
  },
  'jwt.tokenLifetime': {
    env: 'JWT_TOKEN_LIFETIME',
    default: 28800,
    testValues: [
      {value: '3600', expected: 3600},
    ],
  },
  'tls.enabled': {
    env: 'TLS_ENABLED',
    default: true,
    testValues: [
      {value: 'false', expected: false},
      {value: 'true', expected: true},
      {value: 'abc', expected: true},
    ],
  },
  'tls.cert': {
    env: 'TLS_CERT_PATH',
    default: '/etc/ssl/kube-ldap/cert.pem',
    testValues: ['/etc/ssl/example.com/cert.pem'],
  },
  'tls.key': {
    env: 'TLS_KEY_PATH',
    default: '/etc/ssl/kube-ldap/key.pem',
    testValues: ['/etc/ssl/example.com/key.pem'],
  },
  'tls.ca': {
    env: 'TLS_CA_PATH',
    default: null,
    testValues: ['/etc/ssl/example.com/ca.pem'],
  },
  'prometheus.username': {
    env: 'PROMETHEUS_USERNAME',
    default: 'prometheus',
    testValues: [
      {value: 'john.doe', expected: 'john.doe'},
      {value: '', expected: null},
    ],
  },
  'prometheus.password': {
    env: 'PROMETHEUS_PASSWORD',
    default: 'secret',
    testValues: [
      {value: 'password', expected: 'password'},
      {value: '', expected: null},
    ],
  },
  'prometheus.nodejsProbeInterval': {
    env: 'PROMETHEUS_NODEJS_PROBE_INTERVAL',
    default: 10000,
    testValues: [
      {value: '5000', expected: 5000},
    ],
  },
  'port': {
    env: 'PORT',
    default: 8081,
    testValues: [
      {value: '8443', expected: 8443},
    ],
  },
};

for (let setting of Object.keys(fixtures)) {
  describe('config.' + setting, () => {
    test('test default value [' + fixtures[setting].default + ']', () => {
      delete process.env[fixtures[setting].env];
      let config = getConfig(); // eslint-disable-line no-unused-vars
      expect(eval('config.' + setting)).toEqual(fixtures[setting].default);
    });
    for (let testValue of fixtures[setting].testValues) {
      let value = testValue;
      let expected = testValue;
      if (testValue === Object(testValue)) {
        value = testValue.value;
        expected = testValue.expected;
      }
      test('test custom value [' + value + ']', () => {
        process.env[fixtures[setting].env] = value;
        let config = getConfig(); // eslint-disable-line no-unused-vars
        expect(eval('config.' + setting)).toEqual(expected);
      });
    };
  });
};
