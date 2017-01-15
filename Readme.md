# Hapi OAuth Server [![Build Status](https://travis-ci.org/oauthjs/Hapi-oauth-server.png?branch=master)](https://travis-ci.org/oauthjs/Hapi-oauth-server)

Complete, compliant and well tested module for implementing an OAuth2 Server/Provider with [Hapi](https://github.com/Hapijs/Hapi) in [node.js](http://nodejs.org/).

This is the Hapi wrapper for [oauth2-server](https://github.com/oauthjs/node-oauth2-server).

## Installation
    // Not yet published :>
    $ npm install Hapi-oauth-server

## Quick Start

```js
var Hapi = require('Hapi');
app = new hapi.Server();
app.connection({ port: 3000 });
app.register({register: plugin, options: {
  model: {} // See https://github.com/thomseddon/node-oauth2-server for specification
}}, function (err) {
  // Do smthing w/ the error :)
});
app.route({method: 'GET', path: '/authenticate', handler: {'oauth2-authenticate': {}}});
app.route({method: 'GET', path: '/authorize', handler: {'oauth2-authorize': {}}});
app.route({method: 'GET', path: '/token', handler: {'oauth2-token': {}}});
```

## Options

```
var options = {
  useErrorHandler: false, // Not yet tested from the express module
  continueMiddleWare: false,
}
```
* `useErrorHandler`
(_type: boolean_ default: false)

  If false, an error response will be rendered by this component.
  Set this value to true to allow your own Hapi error handler to handle the error.

* `continueMiddleware`
(_type: boolean default: false_)

  The `authorize()` and `token()` middlewares will both render their
  result to the response and end the pipeline.
  next() will only be called if this is set to true.

  **Note:** You cannot modify the response since the headers have already been sent.

  `authenticate()` does not modify the response and will always call next()
