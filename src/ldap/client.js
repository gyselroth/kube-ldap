// @flow
/** Class for an LDAP client */
export default class Client {
  clientFactory: () => Object;
  basedn: string;
  binddn: string;
  bindpw: string;

  /**
  * Create an LDAP client.
  * @param {Function} connectionFactory - Ldap connection factory.
  * @param {string} basedn - The base DN to use.
  * @param {string} binddn - DN of the bind user to use.
  * @param {string} bindpw - Password of the bind user to use.
  */
  constructor(
    connectionFactory: () => Object,
    basedn: string,
    binddn: string,
    bindpw: string
  ) {
    this.clientFactory = connectionFactory;
    this.basedn = basedn;
    this.binddn = binddn;
    this.bindpw = bindpw;
  }

  /**
  * Perform LDAP bind operation
  * @param {string} dn - DN to bind.
  * @param {string} password - Password to bind.
  * @return {Promise<boolean>}
  */
  async bind(dn: string, password: string): Promise<boolean> {
    let client = this.clientFactory();
    let authenticated = false;
    try {
      await client.bind(dn, password, []);
      authenticated = true;
    } catch (error) {
      authenticated = false;
    } finally {
      await client.unbind();
    }
    return authenticated;
  }

  /**
  * Perform LDAP search operation
  * @param {string} filter - LDAP search filter.
  * @param {Array<string>} attributes - List of attributes (optional).
  * @param {string} basedn - The base DN to use (optional).
  * @return {Promise} Promise fulfilled with search result
  */
  async search(
    filter: string,
    attributes: ?Array<string>,
    basedn: ?string
  ): Promise<Object> {
    let client = this.clientFactory();
    if (!basedn) {
      basedn = this.basedn;
    }

    let searchResult = null;
    try {
      await client.bind(this.binddn, this.bindpw, []);
      const options = {
        filter: filter,
        scope: 'sub',
        attributes: attributes,
      };
      searchResult = await client.search(basedn, options, []);
    } catch (error) {
      throw error;
    } finally {
      await client.unbind();
    }
    if (searchResult && searchResult.searchEntries.length > 0) {
      return searchResult.searchEntries[0];
    } else {
      throw new Error(`no object found with filter [${filter}]`);
    }
  }
}
