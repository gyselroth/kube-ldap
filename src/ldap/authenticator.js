// @flow
import {Logger} from 'winston';
import util from 'util';
import Client from './client';

/** Class for an LDAP authenticator */
export default class Authenticator {
  client: Client;
  filter: string;
  logger: Logger;

  /**
  * Create an LDAP authenticator.
  * @param {Client} client - The ldap client.
  * @param {string} filter - filter for authenticated users.
  * @param {Logger} logger - Logger to use.
  */
  constructor(client: Client, filter: string, logger: Logger) {
    this.client = client;
    this.filter = filter;
    this.logger = logger;
  }

  /**
  * Authenticate user on ldap.
  * @param {string} username - username to authenticate.
  * @param {string} password - password to authenticate.
  * @return {Promise<boolean>}
  */
  async authenticate(username: string, password: string): Promise<boolean> {
    if (password === '') {
      this.logger.info('empty password');
      return false;
    }
    let filter = util.format(this.filter, username);
    try {
      let user = await this.client.search(filter);
      return await this.client.bind(user.dn, password);
    } catch (error) {
      this.logger.info(error.message);
      return false;
    }
  }

  /**
  * Get Attributes of user from ldap
  * @param {string} username - username to authenticate.
  * @param {Array<string>} attributes - attributes to fetch.
  * @return {Promise<Object>}
  */
  async getAttributes(
    username: string,
    attributes: Array<string>
  ): Promise<Object> {
    let filter = util.format(this.filter, username);
    try {
      let result = await this.client.search(filter, attributes);
      return Object.keys(result)
        .filter((attribute) => attributes.includes(attribute))
        .reduce((object, attribute) => {
          return {
            ...object,
            [attribute]: result[attribute],
          };
        }, {});
    } catch (error) {
      throw error;
    }
  }
}
