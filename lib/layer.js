var p2re = require("path-to-regexp");

var layer = function(path, m, end) {
  path = path.charAt(path.length - 1) == "/" ? path.substr(0, path.length - 1) : path;
  this.path = path;
  this.handle = m;
  this.match = function(_path) {
    var names = [],
      _path = decodeURIComponent(_path),
      params = {};
    var re = p2re(path, names, {
      end: end ? end : false
    });
    var test = re.test(_path);
    if (test) {
      var exec = re.exec(_path);
      for (var i = 0; i < names.length; i++) {
        params[names[i].name] = exec[i + 1];
      }
      return {
        "path": exec[0],
        "params": params
      }
    } else {
      return undefined;
    }
  }
}

module.exports = layer;