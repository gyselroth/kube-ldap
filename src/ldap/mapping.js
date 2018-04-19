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
  * @return {Ôbject}
  */
  ldapToKubernetes(ldapObject: Object): Object {
    let object = {
      username: ldapObject[this.username],
      uid: ldapObject[this.uid],
      groups: ldapObject[this.groups].map((group) => {
        return canonicalizeDn(group);
      }),
      extra: {},
    };
    for (let extraField of this.extraFields) {
      object.extra[extraField] = ldapObject[extraField];
    }
    return object;
  }
}

export default Mapping;
