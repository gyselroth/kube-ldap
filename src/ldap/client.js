// @flow
/** Class for an LDAP client */
export default class Client {
  client: Object;
  basedn: string;
  binddn: string;
  bindpw: string;
  _secure: boolean;

  /**
  * Create an LDAP client.
  * @param {Object} conn - Ldap connection.
  * @param {string} basedn - The base DN to use.
  * @param {string} binddn - DN of the bind user to use.
  * @param {string} bindpw - Password of the bind user to use .
  */
  constructor(conn: Object, basedn: string, binddn: string, bindpw: string) {
    this.client = conn;
    this._secure = false;
    this.client.on('connect', () => {
      this.client.starttls({}, [], (err, res) => {
        if (err) {
          throw err;
        }
        this._secure = true;
      });
    });
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
  bind(dn: string, password: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this._secure) {
        reject(new Error('ldap connection not tls protected'));
      }
      this.client.bind(dn, password, [], (err, res) => {
        if (err) {
          resolve(false);
        } else {
          resolve(true);
        }
      });
    });
  }

  /**
  * Perform LDAP search operation
  * @param {string} filter - LDAP search filter.
  * @param {Array<string>} attributes - List of attributes (optional).
  * @param {string} basedn - The base DN to use (optional).
  * @return {Promise} Promise fulfilled with search result
  */
  search(
    filter: string,
    attributes: ?Array<string>,
    basedn: ?string
  ): Promise<Object> {
    if (!basedn) {
      basedn = this.basedn;
    }

    return new Promise((resolve, reject) => {
      if (!this._secure) {
        reject(new Error('ldap connection not tls protected'));
      }
      let that = this;
      this.client.bind(this.binddn, this.bindpw, [], (err, res) => {
        if (err) {
          reject(err);
        } else {
          let options = {
            filter: filter,
            scope: 'sub',
            attributes: attributes,
          };
          that.client.search(basedn, options, [], (err, res) => {
            let searchResult = null;
            if (err) {
              reject(err);
            } else {
              res.on('searchEntry', function(entry) {
                searchResult = entry.object;
              });
              res.on('error', function(err) {
                reject(err);
              });
              res.on('end', function(result) {
                if (result.status !== 0) {
                  reject(result.status);
                } else {
                  if (searchResult) {
                    resolve(searchResult);
                  } else {
                    reject(new Error(`no object found with filter [${filter}]`));
                  }
                }
              });
            }
          });
        }
      });
    });
  }
}
