import ldap from 'ldapjs';
jest.mock('ldapjs');
import request from 'supertest';
import jwt from 'jsonwebtoken';
import {config} from '../../src/config';
import app from '../../src/app';

const fixtures = {
  ldap: {
    username: 'john.doe',
    memberOf: [
      'cn=test,dc=example,dc=com',
    ],
  },
  tokenPayload: {
    username: 'john.doe',
    uid: 'john.doe',
    groups: [
      'test',
    ],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000 + 3600),
  },
  tokenReviewTemplate: {
    apiVersion: 'authentication.k8s.io/v1beta1',
    kind: 'TokenReview',
    spec: {
      'token': null,
    },
  },
};

let connection = ldap.createClient();

describe('test app routes', () => {
  beforeEach(() => {
    connection.starttlsReturnsError = false;
    connection.bindReturnsError = false;
    connection.searchReturnsError = false;
    connection.searchEmitsError = false;
    connection.searchEmitsEnd = false;
    connection.searchEmitsEndStatus = 0;
    connection.searchResult = {
      uid: fixtures.ldap.username,
      memberOf: fixtures.ldap.memberOf,
    };
  });
  test('GET /healthz: 200 OK', (done) => {
    request(app)
      .get('/healthz')
      .expect(200, 'OK')
      .end((err) => {
        done(err);
      });
  });
  test('GET /auth: 200 OK', (done) => {
    request(app)
      .get('/auth')
      .auth('john.doe', 'secret')
      .expect(200)
      .expect((response) => {
        try {
          jwt.verify(response.text, config.jwt.key);
        } catch (error) {
          throw new Error(
            '[' + error.name + '] while validating JWT: ' + error.message
          );
        }
      })
      .expect((response) => {
        let object = jwt.decode(response.text);
        expect(object.username).toBe(fixtures.tokenPayload.username);
        expect(object.uid).toBe(fixtures.tokenPayload.uid);
        expect(object.groups).toEqual(fixtures.tokenPayload.groups);
      })
      .end((error) => {
        done(error);
      });
  });
  test('GET /auth: 400 Bad Request', (done) => {
    request(app)
      .get('/auth')
      .set('Authorization', 'something')
      .expect(400)
      .end((error) => {
        done(error);
      });
  });
  test('GET /auth: 401 Unauthorized (No authorization header)', (done) => {
    request(app)
      .get('/auth')
      .expect(401)
      .end((error) => {
        done(error);
      });
  });
  test('GET /auth: 401 Unauthorized (Wrong username/password)', (done) => {
    connection.bindReturnsError = true;
    request(app)
      .get('/auth')
      .auth('john.doe', 'secret')
      .expect(401)
      .end((error) => {
        done(error);
      });
  });
  test('GET /auth: 500 Internal Server Error', (done) => {
    connection.searchResult.memberOf = null;
    request(app)
      .get('/auth')
      .auth('john.doe', 'secret')
      .expect(500)
      .end((error) => {
        done(error);
      });
  });
  test('POST /token: 200 OK', (done) => {
    let tokenReview = fixtures.tokenReviewTemplate;
    tokenReview.spec.token = jwt.sign(fixtures.tokenPayload, config.jwt.key);
    request(app)
      .post('/token')
      .send(tokenReview)
      .expect(200)
      .expect((response) => {
        let object = response.body;
        expect(object.apiVersion).toBe(fixtures.tokenReviewTemplate.apiVersion);
        expect(object.kind).toBe(fixtures.tokenReviewTemplate.kind);
        expect(object.status.authenticated).toBe(true);
        expect(object.status.user).toEqual(fixtures.tokenPayload);
      })
      .end((error) => {
        done(error);
      });
  });
  test('POST /token: 400 Bad Request', (done) => {
    request(app)
      .post('/token')
      .send({})
      .expect(400)
      .end((error) => {
        done(error);
      });
  });
});
