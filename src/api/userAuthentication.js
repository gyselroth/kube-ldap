// @flow
import {Logger} from 'winston';
import atob from 'atob';
import jwt from 'jsonwebtoken';
import {Authenticator, canonicalizeDn} from '../ldap';

/** Class for UserAuthentication API route */
export default class UserAuthentication {
  authenticator: Authenticator;
  tokenLifetime: number;
  key: string;
  logger: Logger;
  run: (Object, Object) => void

  /**
  * Create API route
  * @param {Authenticator} authenticator - Authenticator.
  * @param {number} tokenLifetime - Token lifetime.
  * @param {string} key - Private key for token signing.
  * @param {Logger} logger - Logger to use.
  */
  constructor(
    authenticator: Authenticator,
    tokenLifetime: number,
    key: string,
    logger: Logger
  ) {
    this.authenticator = authenticator;
    this.tokenLifetime = tokenLifetime;
    this.key = key;
    this.logger = logger;
    this.run = this.run.bind(this);
  }

  /**
  * Run API route
  * @param {Object} req - Request.
  * @param {Object} res - Response.
  * @return {Promise}
  */
  run(req: Object, res: Object) {
    let authHeader = req.get('Authorization');
    if (!authHeader) {
      res.sendStatus(401);
    } else {
      try {
        let credentials = UserAuthentication.parseBasicAuthHeader(authHeader);
        return this.authenticator.authenticate(
          credentials.username,
          credentials.password
        ).then((success) => {
          if (!success) {
            res.sendStatus(401);
          } else {
            return this.getToken(credentials.username).then((token) => {
              res.send(token);
            }, (error) => {
              this.logger.error(error);
              res.sendStatus(500);
            });
          }
        }, (error) => {
          this.logger.info(error);
          res.sendStatus(500);
        });
      } catch (error) {
        this.logger.info(error.message);
        res.sendStatus(400);
      }
    }
  }

  /**
  * Get/Generate token for user
  * @param {string} username - Username.
  * @return {string}
  */
  async getToken(username: string): Promise<string> {
    try {
      let user = await this.authenticator.getAttributes(username, [
        'uid',
        'memberOf',
      ]);

      let data = {
        username: username,
        uid: user.uid,
        groups: user.memberOf.map((group) => {
          return canonicalizeDn(group);
        }),
      };
      let token = jwt.sign(data, this.key, {
        expiresIn: this.tokenLifetime,
      });

      return token;
    } catch (error) {
      throw error;
    }
  }

  /**
  * Parse HTTP "Authorization" header into username/password
  * @param {string} authHeader - Authorization header.
  * @return {Object}
  */
  static parseBasicAuthHeader(authHeader: string): Object {
    let parts = authHeader.split(' ');
    if (parts[0] !== 'Basic' || parts.length < 2) {
      throw new Error('not a valid http basic authorization header');
    }

    let credentials = atob(parts[1]).split(':');
    if (credentials.length < 2) {
      throw new Error('not a valid http basic authorization header');
    }
    return {
      username: credentials[0],
      password: credentials[1],
    };
  }
}
