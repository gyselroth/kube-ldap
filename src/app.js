// @flow
import 'babel-polyfill';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import basicAuth from 'express-basic-auth';
import prometheusBundle from 'express-prom-bundle';
import {Client as Connection} from 'ldapts';
import {config, getConfig} from './config';
import logger from './logger';
import {Client, Authenticator, Mapping} from './ldap';
import {Healthz, UserAuthentication, TokenAuthentication} from './api';

// setup basic dependencies
let ldapClient = new Client(
  new Connection({
    url: config.ldap.uri,
    timeout: config.ldap.timeout * 1000,
    connectTimeout: config.ldap.timeout * 1000,
  }),
  config.ldap.baseDn,
  config.ldap.bindDn,
  config.ldap.bindPw,
);
let authenticator = new Authenticator(ldapClient, config.ldap.filter, logger);

// setup api dependencies
let healthz = new Healthz();
let userAuthentication = new UserAuthentication(
  authenticator,
  config.jwt.tokenLifetime,
  config.jwt.key,
  logger,
);
let tokenAuthentication = new TokenAuthentication(
  authenticator,
  new Mapping(
    config.mapping.username,
    config.mapping.uid,
    config.mapping.groups,
    config.mapping.extraFields,
  ),
  config.jwt.key,
  logger
);

// setup prometheus exporter
let prometheusExporter = prometheusBundle({
  includeMethod: true,
  includePath: true,
  promClient: {
    collectDefaultMetrics: {
      timeout: config.prometheus.nodejsProbeInterval,
    },
  },
});
let prometheusBasicAuth = (req, res, next) => {
  let config = getConfig();
  if (
    Boolean(config.prometheus.username) &&
    Boolean(config.prometheus.password)
  ) {
    basicAuth({
      users: {
        [config.prometheus.username]: config.prometheus.password,
      },
    })(req, res, next);
  } else {
    next();
  }
};

// setup express
const app = express();
app.use(cors());
app.use(morgan('combined', {
  stream: {
    write: (message, encoding) => {
      logger.info(message);
    },
  },
}));
app.use('/metrics', prometheusBasicAuth);
app.use(prometheusExporter);
app.get('/healthz', healthz.run);
app.get('/auth', userAuthentication.run);
app.post('/token', bodyParser.json(), tokenAuthentication.run);
app.use((err, req, res, next) => {
  logger.error(err);
  res.sendStatus(500);
});

export default app;
