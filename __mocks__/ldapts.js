// @flow
declare var jest: any;

let staticMock = null;
/** Mock of Authenticator class */
class LdapMock {
  bindReturnsError: boolean;
  searchReturnsError: boolean;
  searchReturnsResult: boolean;
  searchResult: Object;
  bind: (string, Array<string>) => Promise<Object>;
  unbind: () => void;
  search: (string, Array<string>) => Promise<Object>;
  on: (string, (any) => any) => void;

  /** creates the mock */
  constructor() {
    if (staticMock) {
      return staticMock;
    }
    staticMock = this;
    this.bindReturnsError = false;
    this.searchReturnsError = false;
    this.searchReturnsResult = true;
    this.searchResult = {};
    this.bind = jest.fn();
    this.bind.mockImplementation((dn, password, controls) => {
      if (this.bindReturnsError) {
        throw new Error('error by mock');
      } else {
        return null;
      }
    });
    this.unbind = jest.fn();
    this.search = jest.fn();
    this.search.mockImplementation((base, options, controls) => {
      if (this.searchReturnsError) {
        throw new Error('error by mock');
      } else {
        return {
          searchEntries: this.searchReturnsResult ? [this.searchResult] : [],
        };
      }
    });
  }
}

export {LdapMock as Client};
