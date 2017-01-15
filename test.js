var HapiOAuthServer = require('./index');
var InvalidArgumentError = require('oauth2-server/lib/errors/invalid-argument-error');
var NodeOAuthServer = require('oauth2-server');
var plugin = require('./plugin');
var hapi = require('hapi');
var request = require('supertest');
var should = require('should');
var sinon = require('sinon');

var app = new hapi.Server();
app.connection({ port: 3000 });
function checkHapiPluginError (name) {
  return function (error) {
    if (error) {
      console.error('Failed loading a Hapi plugin: "' + name + '".');
      throw error;
    }
  };
}


app.register({register: plugin, options: {model: {}}}, function (err) {
  checkHapiPluginError('oauth')(err);
});
console.log(Object.keys(app.plugins.HapiOAuthServer.oauth));
app.route({method: 'GET', path: '/', handler: {'oauth2-authenticate': {}}});

app.start(function (err) {
  if (err) throw err;
  request(app.listener)
    .get('/')
    .expect({ error: 'invalid_argument', error_description: 'Invalid argument: model does not implement `getAccessToken()`' })
});
