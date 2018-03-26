// @flow
import 'babel-polyfill';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import {Logger, transports} from 'winston';
import ldap from 'ldapjs';
import config from './config';
import {Client, Authenticator} from './ldap';
import {Healthz, UserAuthentication, TokenAuthentication} from './api';

// setup logging
const logger = new Logger({
  level: config.loglevel,
  transports: [
    new transports.Console({
      handleExceptions: true,
      timestamp: true,
    }),
  ],
  exitOnError: false,
});

// setup basic dependencies
let ldapClient = new Client(
  ldap.createClient({
    url: config.ldap.uri,
  }),
  config.ldap.baseDn,
  config.ldap.bindDn,
  config.ldap.bindPw
);
let authenticator = new Authenticator(ldapClient, config.ldap.filter, logger);

// setup api dependencies
let healthz = new Healthz();
let userAuthentication = new UserAuthentication(
  authenticator,
  config.jwt.tokenLifetime,
  config.jwt.key,
  logger);
let tokenAuthentication = new TokenAuthentication(config.jwt.key, logger);

// setup express
let app = express();
app.use(cors());
app.use(morgan('combined', {
  stream: {
    write: (message, encoding) => {
      logger.info(message);
    },
  },
}));
app.get('/healthz', healthz.run);
app.get('/auth', userAuthentication.run);
app.post('/token', bodyParser.json(), tokenAuthentication.run);

app.listen(config.port, () => {
  logger.info(`kube-ldap listening on port ${config.port}`);
});
