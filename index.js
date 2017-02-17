'use strict';
var _ = require('lodash');
/**
 * Module dependencies.
 */

var InvalidArgumentError = require('oauth2-server/lib/errors/invalid-argument-error');
var Promise = require('bluebird');

var UnauthorizedRequestError = require('oauth2-server/lib/errors/unauthorized-request-error');
var Request = require('./requestWrapper');
var Response = require('./responseWrapper');
/**
 * Constructor.
 */
module.exports = HapiOAuthServer;

function HapiOAuthServer (options) {
    options = options || {};
    if (!options.model) {
      throw new InvalidArgumentError('Missing parameter: `model`');
    }

    this.useErrorHandler = options.useErrorHandler ? true : false;
    delete options.useErrorHandler;

    this.continueMiddleware = options.continueMiddleware ? true : false;
    delete options.continueMiddleware;
}

/**
 * Authentication Middleware.
 *
 * Returns a middleware that will validate a token.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-7)
 */

HapiOAuthServer.prototype.authenticate = function(server, options) {
  return function(req, reply) {
    var that = req.server.plugins.HapiOAuthServer;
    var request = Request.fromHapi(req);
    var response = Response.fromHapi(req);
    var authOptions = req.route.settings.plugins.HapiOAuthServer || options;
    return Promise.bind(that)
      .then(function() {
        return that.server.authenticate(request, response, authOptions);
      })
      .tap(function(token) {
        req.locals = {};
        req.locals.oauth = { token: token };
        if (!authOptions.isHandler) {
          console.log('reply.continue');
          reply.continue({credentials: req.locals.oauth}); // This way we can use it both as a handler OR an auth middleware
        }
      })
      .catch(function(e) {
        console.log('reply.continueErr', e);
        return handleError.call(this, e, req, req.response, null, reply);
      });
  };
};

/**
 * Authorization Middleware.
 *
 * Returns a middleware that will authorize a client to request tokens.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-3.1)
 */

HapiOAuthServer.prototype.authorize = function(route, options) {

  return function(req, reply) {
    var that = req.server.plugins.HapiOAuthServer;
    var request = new Request.fromHapi(req);
    var response = new Response.fromHapi(req);
    request.user = req.user;
    var authOptions = req.route.settings.plugins.HapiOAuthServer || options;
    return Promise.bind(that)
      .then(function() {
        return that.server.authorize(request, response, authOptions);
      })
      .tap(function(code) {
        console.log('tapped');
        req.locals = {};
        req.locals.oauth = { code: code };
        if (that.continueMiddleware) {
          reply.continue();
        }
      })
      .then(function() {
        return handleResponse.call(this, req, req.response, response, reply);
      })
      .catch(function(e) {
        return handleError.call(this, e, req, req.response, response, reply);
      });
  };
};

/**
 * Grant Middleware.
 *
 * Returns middleware that will grant tokens to valid requests.
 *
 * (See: https://tools.ietf.org/html/rfc6749#section-3.2)
 */

HapiOAuthServer.prototype.token = function(route, options) {
  return function(req, reply) {
    var that = req.server.plugins.HapiOAuthServer;
    var request = Request.fromHapi(req);
    var response = Response.fromHapi(req);
    var authOptions = req.route.settings.plugins.HapiOAuthServer || options;
    return Promise.bind(that)
      .then(function() {
        return that.server.token(request, response, authOptions);
      })
      .tap(function(token) {
        req.locals = {};
        req.locals.oauth = { token: token };
        if (that.continueMiddleware) {
          reply.continue();
        }
      })
      .then(function () {
        return handleResponse.call(this, req, req.response, response, reply);
      })
      .catch(function (e) {
        return handleError.call(this, e, req, req.response, response, reply);
      });
  };
};

/**
 * Handle response.
 */
var handleResponse = function(req, res, response, reply) {

  if (response.status === 302) {
    var location = response.headers.location;
    delete response.headers.location;
    return reply.redirect(location);
  } else {
    reply(response.body);
  }
};

/**
 * Handle error.
 */

var handleError = function(e, req, res, response, reply) {

  if (this.useErrorHandler === true) {
    reply(e);
  } else {
    var crafted = Response.toHapi(req, response, e);

    if (e instanceof UnauthorizedRequestError) {
      return reply();
    }
    return reply(crafted);
  }
};
