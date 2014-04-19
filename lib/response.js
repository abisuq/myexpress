var http = require('http'),
  mime = require('mime'),
  accepts = require('accepts'),
  proto = {};

proto.isExpress = true;
proto.__proto__ = http.ServerResponse.prototype;
proto.redirect = function(status, url) {
  if (typeof status !== 'number') {
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
  this.setHeader('Content-Type', mime.lookup(type));
}
proto.default_type = function(type) {
  if (!this.getHeader('content-type')) this.setHeader('Content-Type', mime.lookup(type));
}
proto.format = function(obj) {
  var keys = Object.keys(obj);
  if (keys.length) {
    var accept = accepts(this.req);
    var key = this.req.accepts(keys);
    this.type(key);
    obj[key]();
  } else {
    this.statusCode = 406;
    this.end();
  }
}
proto.send = function(status, body) {
  if (typeof status !== 'number') {
    body = status;
    status = 200;
  }
  body = body ? body : "Created";
  switch (typeof body) {
    case 'object':
      Buffer.isBuffer(body) ? this.default_type('bin') : this.default_type('json');
      break;
    case 'string':
      this.default_type('html');
  }
  this.statusCode = status;
  this.setHeader('Content-Length', Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body));
  this.end(body);
}
module.exports = proto;