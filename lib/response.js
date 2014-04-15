var http = require('http'),
  mime = require('mime'),
  proto = {};

proto.isExpress = true;
proto.__proto__ = http.ServerResponse.prototype;
proto.redirect = function(status, url) {
  if (typeof status !== "number") {
    url = status;
    status = 302;
  }
  this.writeHead(status, {
    'Location': url,
    'Content-Length': 0
  });
  this.end();
}
proto.type = function(type) {
  this.setHeader("Content-Type", mime.lookup(type));
}
proto.default_type = function(type) {
  if (!this.getHeader('content-type')) this.setHeader("Content-Type", mime.lookup(type));
}

module.exports = proto;