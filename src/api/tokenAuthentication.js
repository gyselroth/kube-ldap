// @flow
import {Logger} from 'winston';
import jwt from 'jsonwebtoken';

/** Class for TokenAuthentication API route */
export default class TokenAuthentication {
  key: string;
  logger: Logger;
  run: (Object, Object) => void
  extractAndVerifyToken: (string) => Object

  /**
  * Create API route
  * @param {string} key - Private key.
  * @param {Logger} logger - Logger to use.
  */
  constructor(key: string, logger: Logger) {
    this.key = key;
    this.logger = logger;
    this.run = this.run.bind(this);
    this.extractAndVerifyToken = this.extractAndVerifyToken.bind(this);
  }

  /**
  * Run API route
  * @param {Object} req - Request.
  * @param {Object} res - Response.
  */
  run(req: Object, res: Object) {
    if (
      !req.body.apiVersion ||
      !req.body.kind ||
      !req.body.spec ||
      !req.body.spec.token
    ) {
      res.sendStatus(400);
    } else if (
      req.body.apiVersion !== 'authentication.k8s.io/v1beta1' ||
      req.body.kind !== 'TokenReview'
    ) {
      res.sendStatus(400);
    } else {
      let responseData = {
        apiVersion: 'authentication.k8s.io/v1beta1',
        kind: 'TokenReview',
        status: {
          authenticated: false,
          user: {},
        },
      };

      let token =req.body.spec.token;
      try {
        let data = this.extractAndVerifyToken(token);
        responseData.status.user = data;
        responseData.status.authenticated = true;
      } catch (error) {
        delete responseData.status.user;
        responseData.status.authenticated = false;
        this.logger.info('Error while verifying token: ' +
          `[${error.name}] with message [${error.message}]`);
      }
      res.send(responseData);
    }
  }

  /**
  * Validate token
  * @param {string} token - The token.
  * @return {Object}
  */
  extractAndVerifyToken(token: string): Object {
    try {
      return jwt.verify(token, this.key);
    } catch (error) {
      throw error;
    }
  }
}
