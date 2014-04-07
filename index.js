var http = require("http");
module.exports = express = function() {
	var app = function(req, res, next) {
		app.handle(req, res, next);
	}
	app.listen = function(port, callback) {
		return http.createServer(this).listen(port, callback);
	}

	app.stack = [];

	app.handle = function(req, res, next) {
		var index = 0, stack = this.stack;
		function next(err) {
			if(err) {
				res.statusCode = 500;
        			res.end("500 - hehe,you die.");
			}
			var layer = stack[index++];
			if (!layer) {
				res.statusCode = 404;
        			res.end("404 - Not Found");
			}else{
				layer(req, res, next);
				next();
			}
		}	
		next();
	}

	app.use = function(m) {
		this.stack .push(m);
	}

	return app;
 }

