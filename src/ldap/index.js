// @flow
import Client from './client';
import Authenticator from './authenticator';

let canonicalizeDn = (dn: string) => {
  let firstPart = dn.split(',')[0].split('=');
  if (firstPart.length < 2) {
    throw new Error('invalid dn');
  }
  return firstPart[1];
};

export {
  Client,
  Authenticator,
  canonicalizeDn,
};
