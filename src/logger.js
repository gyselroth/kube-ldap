// @flow
import {Logger, transports} from 'winston';
import {config} from './config';

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

export default logger;
