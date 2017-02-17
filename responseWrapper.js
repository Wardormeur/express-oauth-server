var Response = require('oauth2-server').Response;
var _ = require('lodash');

var responseWrapper = {
  /* From HapiJS response
  to a node-Oauth2 response
   */
  fromHapi : function (request) {
    return new Response(request.raw.res);
  },
  toHapi : function (request, response, error) {
    var crafted = request.generateResponse();
    request.plugins.HapiOAuthServer = {};
    request.plugins.HapiOAuthServer.origin = true;
    if (response) {
      if (!_.isEmpty(response.headers)) {
        _.each(response.headers, function (header, key) {
          crafted.headers[key] = header;
        });
      }
      crafted.body = response.body;
    }
    if (error) {
      console.log('responseWrapper Err', error);
      crafted.source = { error: error.name, error_description: error.message };
      crafted.code(error.code);
    }
    return crafted;
  }
};
module.exports = responseWrapper;
