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

HapiOAuthServer.prototype.authenticate = function(route, options) {

  return function(req, reply) {
    var that = req.server.plugins.HapiOAuthServer;

    var request = Request.fromHapi(req);
    var response = Response.fromHapi(req);
    return Promise.bind(that)
      .then(function() {
        return that.server.authenticate(request, response, options);
      })
      .tap(function(token) {
        req.locals = {};
        req.locals.oauth = { token: token };
        reply();
      })
      .catch(function(e) {
        console.log(e);
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

  console.log('authorize');

  return function(req, reply) {
    var that = req.server.plugins.HapiOAuthServer;
    console.log('authorizeCb');
    var request = new Request.fromHapi(req);
    var response = new Response.fromHapi(req);

    return Promise.bind(that)
      .then(function() {
        return that.server.authorize(request, response, options);
      })
      .tap(function(code) {
        console.log('set code');
        req.locals = {};
        req.locals.oauth = { token: code };
        if (that.continueMiddleware) {
          reply.continue();
        }
      })
      .then(function() {
        console.log('final');
        return handleResponse.call(this, req, req.response, response, reply);
      })
      .catch(function(e) {
        console.log('err', e);
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

    return Promise.bind(that)
      .then(function() {
        console.log('token()');
        return that.server.token(request, response, options);
      })
      .tap(function(token) {
        console.log('locals set');
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
    console.log('handleResponse()')//, response.headers, location);
    // res.set(response.headers);
    return reply.redirect(location);
  } else {
    console.log('handleResponseElse()') //, response.headers);
    // res.set(response.headers);
    reply(response.body)//.status(response.status).send();
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

    // console.log(req.response, crafted);
    // console.log('precheck', crafted);
    if (e instanceof UnauthorizedRequestError) {
      return reply();
    }
    console.log('finalcheck');
    return reply(crafted);
  }
};
