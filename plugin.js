var HapiOAuthServer = require('./index.js');
var NodeOAuthServer = require('oauth2-server');

exports.register = function (server, options, next) {
  // var routed = options.routed || false;
  // delete options.routed;
  var oauth = new HapiOAuthServer(options);
  server.expose('server', new NodeOAuthServer(options));
  server.expose('oauth', oauth);
  // if (routed) {
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
