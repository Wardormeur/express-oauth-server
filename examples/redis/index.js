
/**
 * Module dependencies.
 */

var bodyParser = require('body-parser');
var Hapi = require('Hapi');
var oauthServer = require('oauth2-server');

// Create an Hapi application.
var app = Hapi();

// Add body parser.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Add OAuth server.
app.oauth = oauthServer({
  model: require('./model')
});

// Post token.
app.post('/oauth/token', app.oauth.token());

// Get secret.
app.get('/secret', app.oauth.authorize(), function(req, res) {
  // Will require a valid access_token.
  res.send('Secret area');
});

app.get('/public', function(req, res) {
  // Does not require an access_token.
  res.send('Public area');
});

// Start listening for requests.
app.listen(3000);
