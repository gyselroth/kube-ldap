// @flow
declare var jest: any;
import EventEmitter from 'events';

/** Mock of Authenticator class */
class LdapMock {
  starttlsReturnsError: boolean;
  bindReturnsError: boolean;
  searchReturnsError: boolean;
  searchEmitsError: boolean;
  searchEmitsResult: boolean;
  searchEmitsEndStatus: number;
  searchResult: Object;
  emitter: EventEmitter;
  starttls: (string, Array<string>) => Promise<Object>;
  bind: (string, Array<string>) => Promise<Object>;
  search: (string, Array<string>) => Promise<Object>;
  on: (string, (any) => any) => void;

  /** creates the mock */
  constructor() {
    this.starttlsReturnsError = false;
    this.bindReturnsError = false;
    this.searchReturnsError = false;
    this.searchEmitsError = false;
    this.searchEmitsResult = true;
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
          if (this.searchEmitsError) {
            this.emitter.emit('error', new Error('error by mock'));
          } else {
            if (this.searchEmitsResult) {
              this.emitter.emit('searchEntry', {
                object: this.searchResult,
              });
            }
            this.emitter.emit('end', {
              status: this.searchEmitsEndStatus,
            });
          }
        }, 100);
        callback(null, this.emitter);
      }
    });
    this.on = jest.fn();
    this.on.mockImplementation((event, callback) => {
      callback();
    });
  }
}

let client = null;
const ldapMock = {
  createClient: () => {
    if (!client) {
      client = new LdapMock();
    }
    return client;
  },
};

export default ldapMock;
