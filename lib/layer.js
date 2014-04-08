var layer = function(path, m) {
	this.handle = m;
	this.match = function(_path) {
		return  _path.match(path) ? {"path" : path} : undefined;
	}
}

module.exports = layer;