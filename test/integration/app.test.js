import {Client as Connection} from 'ldapts';
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
  tokenReviewPayload: {
    username: 'john.doe',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000 + 3600),
  },
  tokenReviewResponse: {
    username: 'john.doe',
    uid: 'john.doe',
    groups: [
      'test',
    ],
    extra: {},
  },
  tokenReviewTemplate: {
    apiVersion: 'authentication.k8s.io/v1beta1',
    kind: 'TokenReview',
    spec: {
      'token': null,
    },
  },
};

let connection = new Connection();

describe('test app routes', () => {
  beforeEach(() => {
    connection.bindReturnsError = false;
    connection.searchReturnsError = false;
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
        expect(object.username).toBe(fixtures.tokenReviewPayload.username);
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
  test('POST /token: 200 OK', (done) => {
    let tokenReview = fixtures.tokenReviewTemplate;
    tokenReview.spec.token = jwt.sign(fixtures.tokenReviewPayload, config.jwt.key);
    request(app)
      .post('/token')
      .send(tokenReview)
      .expect(200)
      .expect((response) => {
        let object = response.body;
        expect(object.apiVersion).toBe(fixtures.tokenReviewTemplate.apiVersion);
        expect(object.kind).toBe(fixtures.tokenReviewTemplate.kind);
        expect(object.status.authenticated).toBe(true);
        expect(object.status.user).toEqual(fixtures.tokenReviewResponse);
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
  test('GET /metrics: 200 OK (enabled basic auth)', (done) => {
    request(app)
      .post('/metrics')
      .auth(config.prometheus.username, config.prometheus.password)
      .expect(200)
      .end((error) => {
        done(error);
      });
  });
  test('GET /metrics: 200 OK (with disabled basic auth)', (done) => {
    process.env.PROMETHEUS_USERNAME = '';
    process.env.PROMETHEUS_PASSWORD = '';
    request(app)
      .post('/metrics')
      .expect(200)
      .end((error) => {
        delete process.env.PROMETHEUS_USERNAME;
        delete process.env.PROMETHEUS_PASSWORD;
        done(error);
      });
  });
  test('GET /metrics: 401 Unauthorized (No authorization header)', (done) => {
    request(app)
      .post('/metrics')
      .expect(401)
      .end((error) => {
        done(error);
      });
  });
  test('GET /metrics: 401 Unauthorized (Wrong username/password)', (done) => {
    request(app)
      .post('/metrics')
      .auth('john.doe', 'secret')
      .expect(401)
      .end((error) => {
        done(error);
      });
  });
  test('GET /metrics: 401 Unauthorized (Wrong username/password)', (done) => {
    request(app)
      .post('/metrics')
      .auth('john.doe', 'secret')
      .expect(401)
      .end((error) => {
        done(error);
      });
  });
});
