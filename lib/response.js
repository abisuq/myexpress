var http = require('http'),
  mime = require('mime'),
  accepts = require('accepts'),
  crc32 = require('buffer-crc32'),
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
  var len;
  if (typeof status !== 'number') body = status, status = 200;
  else body = body ? body : http.STATUS_CODES[status];
  this.statusCode = status;
  switch (typeof body) {
    case 'object':
      if (Buffer.isBuffer(body)) {
        this.default_type('bin');
      } else {
        body = JSON.stringify(body),
        this.default_type('json');
      }
      break;
    case 'string':
      this.default_type('html');
      break;
  }
  this.setHeader('Content-Length', len = Buffer.isBuffer(body) ? body.length : Buffer.byteLength(body));
  if (this.req.method == 'GET' && len && !this.getHeader('ETag')) {
    this.setHeader('ETag', '"' + crc32.signed(body) + '"');
  }
  if (this.req.headers['if-none-match'] == this.getHeader('ETag') || new Date(this.req.headers["if-modified-since"]) >= new Date(this.getHeader("Last-Modified"))) {
    this.statusCode = 304;
  }
  this.end(body);
}
module.exports = proto;