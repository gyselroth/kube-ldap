// @flow
declare var jest: any;
/** Mock of Authenticator class */
export default class AuthenticatorMock {
  authenticated: boolean;
  attributes: Object;
  getAttributesShouldThrowError: boolean;
  getAttributes: (string, Array<string>) => Promise<Object>;
  authenticate: (string, string) => Promise<boolean>;

  /** creates the mock */
  constructor() {
    this.authenticated = false;
    this.attributes = {};
    this.getAttributesShouldThrowError = false;
    this.getAttributes = jest.fn();
    this.getAttributes.mockImplementation((username, attributes) => {
      return new Promise((resolve, reject) => {
        if (this.getAttributesShouldThrowError) {
          reject('rejected by mock');
        }
        resolve(this.attributes);
      });
    });
    this.authenticate = jest.fn();
    this.authenticate.mockImplementation((username, password) => {
      return new Promise((resolve) => {
        resolve(this.authenticated);
      });
    });
  }
}
