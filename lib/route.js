var makeRoute = function(verb, handle) {
  return function(req, res, next) {
    if (req.method.toLowerCase() == verb.toLowerCase()) {
      switch (verb) {
        case "get":
          return handle(req, res, next);
        default:
          return undefined;
      }
    } else return next();
  }
}

module.exports = makeRoute;