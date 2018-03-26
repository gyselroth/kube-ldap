// @flow
declare var jest: any;
/** Mock of Client class */
export default class ClientMock {
  bindSuccess: boolean;
  searchResult: Object;
  searchShouldReject: boolean;
  bind: (string, string) => Promise<boolean>;
  search: (string, ?Array<string>, ?string) => Promise<Object>;

  /** creates the mock
  */
  constructor() {
    this.bindSuccess = false;
    this.bind = jest.fn();
    this.bind.mockImplementation((dn: string, password: string) => {
      return new Promise((resolve) => resolve(this.bindSuccess));
    });
    this.search = jest.fn();
    this.search.mockImplementation(
      (filter: string, attributes: ?Array<string>, basedn: ?string) => {
        return new Promise((resolve, reject) => {
          if (this.searchShouldReject) {
            reject('rejected by mock');
          }
          resolve(this.searchResult);
        });
    });
  }
}
