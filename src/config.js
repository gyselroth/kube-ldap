// @flow

const parseBooleanFromEnv = (env: ?string, defaultValue: boolean): boolean => {
  return env == 'true' ? true : (env == 'false' ? false : defaultValue);
};

const parseArrayFromEnv = (
  env: ?string,
  delimiter: string,
  defaultValue: Array<string>
): Array<string> => {
  return env ? env.split(delimiter) : defaultValue;
};

const parseNullableFromEnv = (
  env: ?string,
  defaultValue: any,
): any => {
  return typeof(env) === 'undefined' ? defaultValue : (env || null);
};

const getConfig = () => {
  let config = {
    loglevel: process.env.LOGLEVEL || 'info',
    ldap: {
      uri: process.env.LDAP_URI || 'ldap://ldap.example.com',
      bindDn: process.env.LDAP_BINDDN || 'uid=bind,dc=example,dc=com',
      bindPw: process.env.LDAP_BINDPW || 'secret',
      baseDn: process.env.LDAP_BASEDN || 'dc=example,dc=com',
      filter: process.env.LDAP_FILTER || '(uid=%s)',
      timeout: parseInt(process.env.LDAP_TIMEOUT) || 0,
    },
    mapping: {
      username: process.env.MAPPING_USERNAME || 'uid',
      uid: process.env.MAPPING_UID|| 'uid',
      groups: process.env.MAPPING_GROUPS || 'memberOf',
      extraFields: parseArrayFromEnv(
        process.env.MAPPING_EXTRAFIELDS,
        ',',
        []
      ),
    },
    jwt: {
      key: process.env.JWT_KEY || 'secret',
      tokenLifetime: parseInt(process.env.JWT_TOKEN_LIFETIME) || 28800,
    },
    tls: {
      enabled: parseBooleanFromEnv(process.env.TLS_ENABLED, true),
      cert: process.env.TLS_CERT_PATH || '/etc/ssl/kube-ldap/cert.pem',
      key: process.env.TLS_KEY_PATH || '/etc/ssl/kube-ldap/key.pem',
      ca: process.env.TLS_CA_PATH || null,
    },
    prometheus: {
      username: parseNullableFromEnv(
        process.env.PROMETHEUS_USERNAME,
        'prometheus'
        ),
      password: parseNullableFromEnv(process.env.PROMETHEUS_PASSWORD, 'secret'),
      nodejsProbeInterval: parseInt(
        process.env.PROMETHEUS_NODEJS_PROBE_INTERVAL
      ) || 10000,
    },
    port: 0,
  };
  config.port = parseInt(process.env.PORT) || (
    config.tls.enabled ? 8081 : 8080
  );
  return config;
};

const config = getConfig();

export {config, getConfig};
