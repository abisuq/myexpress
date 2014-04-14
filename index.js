var http = require("http");
var Layer = require("lib/layer");
var makeRoute = require("lib/route");
var methods = require("methods");


module.exports = express = function() {
  var app = function(req, res, next) {
    app.monkey_patch(req, res);
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
        req.app = app;
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
  app.use = function(path, m, end) {
    if (typeof path == "function") {
      m = path;
      path = "/";
    };
    var layer = new Layer(path, m, end);
    this.stack.push(layer);
  }

  app.route = function(path) {
    var rt = makeRoute();
    app.use(path, rt, true);
    return rt;
  }

  methods.concat("all").forEach(function(method) {
    app[method] = function(path, m) {
      var route = app.route(path);
      route.use(method, m);
      return app;
    }
  })

  app.monkey_patch = function(req, res) {
    var reqP = require("lib/request");
    var resP = require("lib/response");
    req.__proto__ = reqP;
    res.__proto__ = resP;
    req.res = res;
    res.req = req;
  }

  return app;
}