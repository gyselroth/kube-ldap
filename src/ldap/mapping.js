// @flow
import {canonicalizeDn} from '../ldap';

/** Class for an Kubernetes<=>LDAP attribute mapping */
class Mapping {
  username: string;
  uid: string;
  groups: string;
  extraFields: Array<string>

  /**
  * Create an Kubernetes<=>LDAP attribute mapping.
  * @param {string} username - Attribute name for the kubernetes username.
  * @param {string} uid - Attribute name for the kubernetes uid.
  * @param {string} groups - Attribute name for the kubernetes groups array.
  * @param {Array<string>} extraFields - Array of kubernetes extra attributes
  */
  constructor(
    username: string,
    uid: string,
    groups: string,
    extraFields: Array<string>
  ) {
    this.username = username;
    this.uid = uid;
    this.groups = groups;
    this.extraFields = extraFields;
  }

  /**
  * Get array of LDAP attribute names
  * @return {Array<string>}
  */
  getLdapAttributes(): Array<string> {
    let attributes = [this.username, this.uid, this.groups];
    return attributes.concat(this.extraFields);
  }

  /**
  * Convert ldap object to kubernetes
  * @param {Object} ldapObject - Ldap object to convert
  * @param {boolean} withGroupAndExtra - Include groups and extra attributes
  * @return {Object}
  */
  ldapToKubernetes(ldapObject: Object, withGroupAndExtra: boolean = true): Object {
    let groupAndExtra = {};
    if (withGroupAndExtra) {
      groupAndExtra = {
        groups: this.getGroups(ldapObject).map((group) => {
            return canonicalizeDn(group);
          }),
        extra: this.extraFields.reduce((object, field) => {
          return {
            ...object,
            [field]: ldapObject[field],
          };
        }, {}),
      };
    }
    return {
      username: ldapObject[this.username],
      uid: ldapObject[this.uid],
      ...groupAndExtra,
    };
  }

  /**
  * Get group of LDAP object
  * @param {Object} ldapObject - Ldap object to convert
  * @return {Array}
  */
  getGroups(ldapObject: Object): Array<string> {
    let groups = ldapObject[this.groups];
    if (groups instanceof Array) {
      return groups;
    } else {
      return groups ? [groups] : [];
    }
  }
}

export default Mapping;
