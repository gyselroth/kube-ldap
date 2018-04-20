// @flow
import https from 'https';
import fs from 'fs';
import {config} from './config';
import logger from './logger';
import app from './app';

if (config.tls.enabled) {
  https.createServer({
    cert: fs.readFileSync(config.tls.cert),
    key: fs.readFileSync(config.tls.key),
    ca: config.tls.ca ? fs.readFileSync(config.tls.ca) : null,
  }, app).listen(config.port, () => {
    logger.info(`kube-ldap listening on https port ${config.port}`);
  });
} else {
  app.listen(config.port, () => {
    logger.info(`kube-ldap listening on http port ${config.port}`);
  });
}
