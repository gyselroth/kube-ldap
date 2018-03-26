// @flow
declare var jest: any;
import EventEmitter from 'events';

/** Mock of Authenticator class */
class LdapMock {
  starttlsReturnsError: boolean;
  bindReturnsError: boolean;
  searchReturnsError: boolean;
  searchEmitsError: boolean;
  searchEmitsEnd: boolean;
  searchEmitsEndStatus: number;
  searchResult: Object;
  emitter: EventEmitter;
  starttls: (string, Array<string>) => Promise<Object>;
  bind: (string, Array<string>) => Promise<Object>;
  search: (string, Array<string>) => Promise<Object>;

  /** creates the mock */
  constructor() {
    this.starttlsReturnsError = false;
    this.bindReturnsError = false;
    this.searchReturnsError = false;
    this.searchEmitsError = false;
    this.searchEmitsEnd = false;
    this.searchEmitsEndStatus = 0;
    this.searchResult = {};
    this.emitter = new EventEmitter();
    this.starttls = jest.fn();
    this.starttls.mockImplementation((options, controls, callback) => {
      if (this.starttlsReturnsError) {
        callback(new Error('error by mock'));
      } else {
        callback(null);
      }
    });
    this.bind = jest.fn();
    this.bind.mockImplementation((dn, password, controls, callback) => {
      if (this.bindReturnsError) {
        callback(new Error('error by mock'));
      } else {
        callback(null);
      }
    });
    this.search = jest.fn();
    this.search.mockImplementation((base, options, controls, callback) => {
      if (this.searchReturnsError) {
        callback(new Error('error by mock'));
      } else {
        setTimeout(() => {
          if (this.searchEmitsEnd) {
            this.emitter.emit('end', {
              status: this.searchEmitsEndStatus,
            });
          } else if (this.searchEmitsError) {
            this.emitter.emit('error', new Error('error by mock'));
          } else {
            this.emitter.emit('searchEntry', {
              object: this.searchResult,
            });
          }
        }, 100);
        callback(null, this.emitter);
      }
    });
  }
}

const ldapMock = {
  createClient: () => {
    return new LdapMock();
  },
};

export default ldapMock;
