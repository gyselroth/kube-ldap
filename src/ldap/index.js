// @flow
import Client from './client';
import Authenticator from './authenticator';

let canonicalizeDn = (dn: string) => {
  return dn.split(',')[0].split('=')[1];
};

export {
  Client,
  Authenticator,
  canonicalizeDn,
};
