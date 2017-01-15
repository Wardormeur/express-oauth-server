var Request = require('oauth2-server').Request;
var _ = require('lodash');

var requestWrapper = {
  /* From HapiJS response
  to a node-Oauth2 response
   */
  fromHapi : function (request) {
    request.raw.req.query = request.query;
    request.raw.req.body = request.payload;
    return new Request(request.raw.req);
  },
  toHapi : function (request) {
    return request;
  }
};
module.exports = requestWrapper;
