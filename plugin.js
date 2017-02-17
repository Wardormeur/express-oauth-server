var HapiOAuthServer = require('./index.js');
var NodeOAuthServer = require('oauth2-server');
var _ = require('lodash');

exports.register = function (server, options, next) {
  // var routed = options.routed || false;
  // delete options.routed;

  var oauth = new HapiOAuthServer(options);
  server.expose('server', new NodeOAuthServer(options));
  server.expose('oauth', oauth);
  // if (routed) {
    server.auth.scheme('hapi-oauth-server',  function (server, schemeOptions) {
      console.log('plugin setup', _.keys(server), options);
      return {
        authenticate: oauth.authenticate(server, options)
      };
    });
    server.auth.strategy('oauth2-token', 'hapi-oauth-server', oauth.authenticate, false, options);
    // Expose the strategy cb in case you want to use it as a handler instead
    server.handler('oauth2-authenticate', oauth.authenticate);

    server.handler('oauth2-authorize', oauth.authorize);
    server.handler('oauth2-token', oauth.token);
  // } else {
  //   server.ext()
  // }

  next();
};
exports.register.attributes = {
  name: 'HapiOAuthServer'
};
