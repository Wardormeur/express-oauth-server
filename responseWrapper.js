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
    if (response && !_.isEmpty(response.headers)) {
      _.each(response.headers, function (header, key) {
        crafted.headers[key] = header;
      });
    }
    if (error) {
      crafted.source = { error: error.name, error_description: error.message };
      console.log(error);
      crafted.code(error.code);
    }
    return crafted;
  }
};
module.exports = responseWrapper;
