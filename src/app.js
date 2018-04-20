// @flow
import 'babel-polyfill';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import morgan from 'morgan';
import ldap from 'ldapjs';
import {config} from './config';
import logger from './logger';
import {Client, Authenticator, Mapping} from './ldap';
import {Healthz, UserAuthentication, TokenAuthentication} from './api';

// setup basic dependencies
let ldapClient = new Client(
  ldap.createClient({
    url: config.ldap.uri,
    timeout: config.ldap.timeout * 1000,
    connectTimeout: config.ldap.timeout * 1000,
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
  new Mapping(
    config.mapping.username,
    config.mapping.uid,
    config.mapping.groups,
    config.mapping.extraFields,
  ),
  logger);
let tokenAuthentication = new TokenAuthentication(config.jwt.key, logger);

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
app.get('/healthz', healthz.run);
app.get('/auth', userAuthentication.run);
app.post('/token', bodyParser.json(), tokenAuthentication.run);

export default app;
