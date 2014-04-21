var http = require('http'),
  mime = require('mime'),
  accepts = require('accepts'),
  crc32 = require('buffer-crc32'),
  fs = require("fs"),
  path = require('path'),
  rparser = require("range-parser"),
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

proto.stream = function(file) {
  file.pipe(this);
}

proto.sendfile = function(data, options) {
  if (options) {
    data = path.normalize(options.root + "/" + data);
  }
  if (data.indexOf('..') >= 0) {
    this.statusCode = 403;
    this.end();
    return;
  }
  var self = this;
  fs.stat(data, function(err, stats) {
    if (err) {
      self.statusCode = 404;
      self.end();
      return;
    }
    if (stats.isDirectory()) {
      self.statusCode = 403;
      self.end();
      return;
    };
    var range = self.req.headers['range'];
    var fsOpt = {};
    if (range) {
      var r = rparser(stats.size, range);
      if (r[0]) {
        fsOpt = r[0];
        self.statusCode = 206;
        self.setHeader("Content-Range", range.replace(/=/, ' ') + '/' + stats.size);
      }
      if (r == -1) {
        self.statusCode = 416;
        self.end();
        return;
      }
    }
    var file = fs.createReadStream(data, fsOpt);
    self.stream(file);
    self.setHeader('Content-Length', stats.size);
    self.setHeader('Accept-Range', 'bytes');
    self.type(data);
  });
}

module.exports = proto;