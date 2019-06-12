// @flow
import {Logger} from 'winston';
import jwt from 'jsonwebtoken';
import {Authenticator, Mapping} from '../ldap';

/** Class for TokenAuthentication API route */
export default class TokenAuthentication {
  authenticator: Authenticator;
  mapping: Mapping;
  key: string;
  logger: Logger;
  run: (Object, Object) => void
  extractAndVerifyToken: (string) => Object

  /**
  * Create API route
  * @param {Authenticator} authenticator - Authenticator.
  * @param {Mapping} mapping - Attribute mapping (kubernetes<=>ldap).
  * @param {string} key - Private key.
  * @param {Logger} logger - Logger to use.
  */
  constructor(
    authenticator: Authenticator,
    mapping: Mapping,
    key: string,
    logger: Logger
  ) {
    this.authenticator = authenticator;
    this.mapping = mapping;
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
  async run(req: Object, res: Object): Promise<void> {
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
      let token =req.body.spec.token;
      try {
        let responseData = await this._processToken(token);
        res.send(responseData);
      } catch (error) {
        this.logger.error(error);
        res.sendStatus(500);
      }
    }
  }

  /**
  * Process token
  * @param {string} token - The token.
  * @return {Object}
  */
  async _processToken(token: string): Promise<Object> {
    let responseData = {
      apiVersion: 'authentication.k8s.io/v1beta1',
      kind: 'TokenReview',
      status: {
        authenticated: false,
        user: {},
      },
    };
    try {
      let tokenData = this.extractAndVerifyToken(token);
      let ldapObject = await this.authenticator.getAttributes(
        tokenData.username,
        this.mapping.getLdapAttributes()
      );
      responseData.status.user = this.mapping.ldapToKubernetes(ldapObject);
      responseData.status.authenticated = true;
    } catch (error) {
      delete responseData.status.user;
      responseData.status.authenticated = false;
      this.logger.info('Error while verifying token: ' +
        `[${error.name}] with message [${error.message}]`);
    }
    return responseData;
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
