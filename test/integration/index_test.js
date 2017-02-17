'use strict';

/**
 * Module dependencies.
 */

var HapiOAuthServer = require('../../');
var InvalidArgumentError = require('oauth2-server/lib/errors/invalid-argument-error');
var NodeOAuthServer = require('oauth2-server');
var plugin = require('../../plugin');
var hapi = require('hapi');
var request = require('supertest');
var should = require('should');
var sinon = require('sinon');

/**
 * Test `HapiOAuthServer`.
 */

describe('HapiOAuthServer', function() {
  var app;

  function checkHapiPluginError (name) {
    return function (error) {
      if (error) {
        console.error('Failed loading a Hapi plugin: "' + name + '".');
        throw error;
      }
    };
  }

  beforeEach(function() {
    app = new hapi.Server();
    app.connection({ port: 3000 });
  });

  afterEach(function (done) {
    app.stop(function () {
      done();
    });
  });

  describe('constructor()', function() {
    it('should throw an error if `model` is missing', function() {
      try {
        new HapiOAuthServer({});

        should.fail();
      } catch (e) {
        e.should.be.an.instanceOf(InvalidArgumentError);
        e.message.should.equal('Missing parameter: `model`');
      }
    });

    it('should set the `server`', function() {
      app.register({register: plugin, options: {model: {}}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });
      app.plugins.HapiOAuthServer.server.should.be.an.instanceOf(NodeOAuthServer);
    });
  });

  describe('authenticate()', function() {
    it('should return an error if `model` is empty', function(done) {
      app.register({register: plugin, options: {model: {}}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });
      app.route({method: 'GET', path: '/', handler: {'oauth2-authenticate': {}}});

      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
          .get('/')
          .expect({ error: 'invalid_argument', error_description: 'Invalid argument: model does not implement `getAccessToken()`' })
          .end(done);
      });
    });

    it('should authenticate the request', function(done) {
      var token = { user: {} };
      var model = {
        getAccessToken: function() {
          return token;
        }
      };
      app.register({register: plugin, options: {model: model}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });
      app.route({method: 'GET', path: '/', handler: {'oauth2-authenticate': {}}});

      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
          .get('/')
          .set('Authorization', 'Bearer foobar')
          .expect(200)
          .end(done);
      });
    });

    it('should cache the authorization token', function(done) {
      var token = { user: {} };
      var model = {
        getAccessToken: function() {
          return token;
        }
      };
      app.register({register: plugin, options: {model: model}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });

      app.route({method: 'GET', path: '/', handler: {'oauth2-authenticate': {}}});

      var spy = sinon.spy(function(request, reply) {
        request.locals.oauth.token.should.equal(token);
        reply.continue();
      });
      app.ext('onPreResponse', spy);

      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
          .get('/')
          .set('Authorization', 'Bearer foobar')
          .expect(200, function(){
              spy.called.should.be.true;
          })
          .end(done);
      });
    });
  });

  describe('authorize()', function() {
    it('should cache the authorization code', function(done) {
      var code = { authorizationCode: 123 };
      var model = {
        getAccessToken: function() {
          return { user: {} };
        },
        getClient: function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com'] };
        },
        saveAuthorizationCode: function() {
          return code;
        }
      };
      // continueMiddleware: true
      app.register({register: plugin, options: {model: model}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });

      app.route({method: 'POST', path: '/', handler: {'oauth2-authorize': {}}});

      var spy = sinon.spy(function(request, reply) {
        request.locals.oauth.token.should.equal(code);
        return reply.continue();
      });
      app.ext('onPreResponse', spy);

      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
        .post('/?state=foobiz')
        .set('Authorization', 'Bearer foobar')
        .send({ client_id: 12345, response_type: 'code' })
        .expect(200, function() {
            spy.called.should.be.true;
            done();
        });
      });
    });

    it('should return a `location` header with the error', function (done) {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        },
        getClient: function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com'] };
        },
        saveAuthorizationCode: function() {
          return {};
        }
      };
      app.register({register: plugin, options: {model: model, continueMiddleware: true}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });

      app.route({method: 'POST', path: '/', handler: {'oauth2-authorize': {}}});


      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
        .post('/?state=foobiz')
        .set('Authorization', 'Bearer foobar')
        .send({ client_id: 12345 })
        .expect('location', 'http://example.com/?error=invalid_request&error_description=Missing%20parameter%3A%20%60response_type%60&state=foobiz')
        .end(done);
      });
    });

    it('should return a `location` header with the code', function (done) {
      var model = {
        getAccessToken: function() {
          return { user: {} };
        },
        getClient: function() {
          return { grants: ['authorization_code'], redirectUris: ['http://example.com'] };
        },
        saveAuthorizationCode: function() {
          return { authorizationCode: 123 };
        }
      };
      app.register({register: plugin, options: {model: model, continueMiddleware: true}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });

      app.route({method: 'POST', path: '/', handler: {'oauth2-authorize': {}}});

      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
        .post('/?state=foobiz')
        .set('Authorization', 'Bearer foobar')
        .send({ client_id: 12345, response_type: 'code' })
        .expect('Location', 'http://example.com/?code=123&state=foobiz')
        .end(done);
      });
    });

    it('should return an error if `model` is empty', function (done) {
      app.register({register: plugin, options: {model: {}}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });

      app.route({method: 'POST', path: '/', handler: {'oauth2-authorize': {}}});

      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
        .post('/')
        .expect({ error: 'invalid_argument', error_description: 'Invalid argument: model does not implement `getClient()`' })
        .end(done);
      });
    });
  });

  describe('token()', function() {
    it('should cache the authorization token', function(done) {
      var token = { accessToken: 'foobar', client: {}, user: {} };
      var model = {
        getClient: function() {
          return { grants: ['password'] };
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return token;
        }
      };
      app.register({register: plugin, options: { model: model, continueMiddleware: true}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });

      app.route({method: 'POST', path: '/', handler: {'oauth2-token': {}}});
      var spy = sinon.spy(function(request, reply) {
        console.log('spyed');
        request.locals.oauth.token.should.equal(token);
        return reply.continue();
      });
      app.ext('onPreResponse', spy);

      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
        .post('/')
        .send('client_id=foo&client_secret=bar&grant_type=password&username=qux&password=biz')
        .expect({ access_token: 'foobar', token_type: 'Bearer' })
        .expect(200, function(){
          spy.called.should.be.true;
          done();
        });
      });
    });

    it('should return an `access_token`', function(done) {
      var model = {
        getClient: function() {
          return { grants: ['password'] };
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return { accessToken: 'foobar', client: {}, user: {} };
        }
      };
      app.register({register: plugin, options: { model: model, continueMiddleware: true}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });

      app.route({method: 'POST', path: '/', handler: {'oauth2-token': {}}});

      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
        .post('/')
        .send('client_id=foo&client_secret=bar&grant_type=password&username=qux&password=biz')
        .expect({ access_token: 'foobar', token_type: 'Bearer' })
        .end(done);
      });
    });

    it('should return a `refresh_token`', function(done) {
      var model = {
        getClient: function() {
          return { grants: ['password'] };
        },
        getUser: function() {
          return {};
        },
        saveToken: function() {
          return { accessToken: 'foobar', client: {}, refreshToken: 'foobiz', user: {} };
        }
      };
      app.register({register: plugin, options: { model: model}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });

      app.route({method: 'POST', path: '/', handler: {'oauth2-token': {}}});

      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
        .post('/')
        .send('client_id=foo&client_secret=bar&grant_type=password&username=qux&password=biz')
        .expect({ access_token: 'foobar', refresh_token: 'foobiz', token_type: 'Bearer' })
        .end(done);
      });
    });

    it('should return an error if `model` is empty', function(done) {
      app.register({register: plugin, options: { model: {}}}, function (err) {
        checkHapiPluginError('oauth')(err);
      });

      app.route({method: 'POST', path: '/', handler: {'oauth2-token': {}}});

      app.start(function (err) {
        if (err) throw err;
        request(app.listener)
        .post('/')
        .expect({ error: 'invalid_argument', error_description: 'Invalid argument: model does not implement `getClient()`' })
        .end(done);
      });
    });
  });
});
