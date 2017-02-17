var plugin = require('./../../plugin');
var hapi = require('hapi');
var Model = require('./model.js');
var app;

app = new hapi.Server();
app.connection({ port: 3000 });

app.register({register: plugin, options: {model: new Model(), continueMiddleware: true }}, function (err) {
  console.log(err);
});
app.route({method: 'GET', path: '/authenticate', handler: {'oauth2-authenticate': {}}});
app.route({method: 'GET', path: '/dialog/authorize', handler: {'oauth2-authorize': {}}});
app.route({method: 'GET', path: '/token', handler: {'oauth2-token': {}}});

app.start(function (err) {
  if (err) throw err;
});
