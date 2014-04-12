module.exports = function() {
  var route = function() {

  }
  route.stack = [];
  route.use = function(verb, handle) {
    handle["verb"] = verb;
    handle["handle"] = handle;
    this.stack.push(handle);
  }
  return route;
}