var http = require('http'),
  accepts = require('accepts'),
  proto = {};
proto.isExpress = true;
proto.__proto__ = http.IncomingMessage.prototype;
proto.accepts = function() {
  var accept = accepts(this);
  return accept.types.apply(accept, arguments);
};
module.exports = proto;