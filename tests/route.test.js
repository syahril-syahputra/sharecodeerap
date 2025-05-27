const supertest = require('supertest');
const app = require('../app');
const assert = require('assert');

describe('GET /', function() {
  it('responds with json', function(done) {
    supertest(app.handler)
      .get('/')
      .set('Accept', 'application/json')
      .expect(200, done)
  });
});