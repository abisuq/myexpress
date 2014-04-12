var http = require("http");
var Layer = require("lib/layer");
var makeRoute = require("lib/route");
var methods = require("methods");

module.exports = express = function() {
  var app = function(req, res, next) {
    app.handle(req, res, next);
  }
  app.listen = function(port, callback) {
    return http.createServer(this).listen(port, callback);
  }
  app.stack = [];
  app.handle = function(req, res, out) {
    var index = 0,
      stack = this.stack,
      originalUrl = null;

    function next(err) {
      var layer = stack[index++];
      if (originalUrl != null) {
        req.url = originalUrl;
        originalUrl = null;
      }
      if (!layer) {
        if (out) {
          return out(err);
        } else {
          res.statusCode = err ? 500 : 404;
          res.end();
        }
      } else {
        try {
          var match = layer.match(req.url);
          if (match === undefined) return next(err);
          req.params = match.params;
          if (layer.handle.handle) {
            originalUrl = req.url;
            req.url = req.url.substr(layer.path.length);
          }

          var arity = layer.handle.length;
          if (err) {
            if (arity === 4) {
              layer.handle(err, req, res, next);
            } else {
              next(err);
            }
          } else if (arity < 4) {
            layer.handle(req, res, next);
          } else {
            next();
          }
        } catch (e) {
          next(e);
        }
      }
    }
    next();
  }
  app.use = function(path, m) {
    if (typeof path == "function") {
      m = path;
      path = "/";
    };
    var layer = new Layer(path, m);
    this.stack.push(layer);
  }

  app.route = function(path) {
    var rt = makeRoute();
    app.use(path, rt);
    return rt;
  }

  methods.concat("all").forEach(function(method) {
    app[method] = function(path, m) {
      var route = app.route(path);
      route.use(method, m);
      return app;
    }
  })

  return app;
}