var makeRoute = function(verb, handle) {
  return function(req, res, next) {
    if (req.method.toLowerCase() == verb.toLowerCase()) handle(req, res, next);
    else next();
  }
}
module.exports = makeRoute;