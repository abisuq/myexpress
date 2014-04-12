module.exports = function() {
  var appNext, methods = require("methods");
  var route = function(req, res, next) {
    appNext = next;
    route.handle(req, res, next);
  }
  route.handle = function(req, res) {
    var index = 0,
      stack = this.stack;
    req.method = req.method.toLowerCase();

    function next(err) {
      var action = stack[index++];
      if (err == "route") return appNext();
      if (!action) {
        appNext(err);
      } else {
        if (err) next(err);
        else if (action.verb == req.method || action.verb == "all") {
          action.handler(req, res, next);
        } else next();
      }
    }
    next();
  }
  route.stack = [];
  route.use = function(verb, action) {
    action["verb"] = verb.toLowerCase();
    action["handler"] = action;
    this.stack.push(action);
  }

  methods.concat("all").forEach(function(verb) {
    route[verb] = function(action) {
      route.use(verb, action);
      return route;
    }
  });

  return route;
}