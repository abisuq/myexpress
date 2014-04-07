var http = require("http");
module.exports = express = function() {
	var app = function(req, res, next) {
		app.stack[0](req, res, next);
	}
	app.listen = function(port, callback) {
		return http.createServer(this).listen(port, callback);
	}

	app.stack = [];
	app.use = function(m) {
		this.stack .push(m);
	}
	return app;
 }

