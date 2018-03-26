// @flow

export default {
  port: process.env.PORT || 8080,
  loglevel: process.env.LOGLEVEL || 'debug',
  ldap: {
    uri: process.env.LDAP_URI || 'ldap://ldap.example.com',
    bindDn: process.env.LDAP_BINDDN || 'uid=bind,dc=example,dc=com',
    bindPw: process.env.LDAP_BINDPW || 'secret',
    baseDn: process.env.LDAP_BASEDN || 'dc=example,dc=com',
    filter: process.env.LDAP_FILTER || '(uid=%s)',
  },
  jwt: {
    key: process.env.JWT_KEY || 'secret',
    tokenLifetime: parseInt(process.env.JWT_TOKEN_LIFETIME) || 28800,
  },
};
