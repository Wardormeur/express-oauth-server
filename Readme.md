# Hapi OAuth Server [![Build Status](https://travis-ci.org/oauthjs/Hapi-oauth-server.png?branch=master)](https://travis-ci.org/oauthjs/Hapi-oauth-server)

Complete, compliant and well tested module for implementing an OAuth2 Server/Provider with [Hapi](https://github.com/Hapijs/Hapi) in [node.js](http://nodejs.org/).

This is the Hapi wrapper for [oauth2-server](https://github.com/oauthjs/node-oauth2-server).

## Installation

    $ npm install Hapi-oauth-server

## Quick Start

The module provides two middlewares - one for granting tokens and another to authorize them. `Hapi-oauth-server` and, consequently `oauth2-server`, expect the request body to be parsed already.
The following example uses `body-parser` but you may opt for an alternative library.

```js
var bodyParser = require('body-parser');
var Hapi = require('Hapi');
var OAuthServer = require('Hapi-oauth-server');

var app = Hapi();

app.oauth = new OAuthServer({
  model: {}, // See https://github.com/thomseddon/node-oauth2-server for specification
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(app.oauth.authorize());

app.use(function(req, res) {
  res.send('Secret area');
});

app.listen(3000);
```

## Options

```
var options = { 
  useErrorHandler: false, 
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