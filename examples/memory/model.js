
/**
 * Constructor.
 */
var that;

function InMemoryCache() {
  this.clients = [{ clientId : 'ward-steward-2', clientSecret : 'something truly secret',
    redirectUris : ['http://localhost:3001/auth/example-oauth2orize/callback'], grants: ['authorization_code'] }];
  this.tokens = [];
  this.users = [{ id : '123', username: 'thomseddon', password: 'nightworld' }];
  this.authorizationCodes = [];
  that = this;
}

/**
 * Dump the cache.
 */

InMemoryCache.prototype.dump = function() {
  console.log('clients', that.clients);
  console.log('tokens', that.tokens);
  console.log('users', that.users);
};

/*
 * Get access token.
 */

InMemoryCache.prototype.getAccessToken = function(bearerToken) {
  console.log('getAccessToken');
  var tokens = that.tokens.filter(function(token) {
    return token.accessToken === bearerToken;
  });

  return tokens.length ? tokens[0] : false;
};

/**
 * Get refresh token.
 */

InMemoryCache.prototype.getRefreshToken = function(bearerToken) {
  console.log('getRefreshToken');
  var tokens = that.tokens.filter(function(token) {
    return token.refreshToken === bearerToken;
  });

  return tokens.length ? tokens[0] : false;
};

/**
 * Get client.
 */

InMemoryCache.prototype.getClient = function(clientId, clientSecret) {
  var clients = that.clients.filter(function(client) {
    return client.clientId === clientId; // lazy auth && client.clientSecret === clientSecret;
  });
  console.log('getClient', clients[0], clientId, clientSecret);
  return clients.length ? clients[0] : false;
};

/**
 * Save token.
 */

InMemoryCache.prototype.saveToken = function(token, client, user) {
  console.log('saveToken');
  that.tokens.push({
    accessToken: token.accessToken,
    accessTokenExpiresAt: token.accessTokenExpiresAt,
    clientId: client.clientId,
    refreshToken: token.refreshToken,
    refreshTokenExpiresAt: token.refreshTokenExpiresAt,
    userId: user.id
  });
};

/*
 * Get user.
 */

InMemoryCache.prototype.getUser = function(username, password) {
  var users = that.users.filter(function(user) {
    return user.username === username && user.password === password;
  });
  return users.length ? users[0] : false;
};

/*
 * Save authorization code.
 */

InMemoryCache.prototype.saveAuthorizationCode = function(authorization_code) {
    console.log('saveAuthorizationCode');
   that.authorizationCodes.push(authorization_code);
};



/**
 * Export constructor.
 */

module.exports = InMemoryCache;
