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
		function next(e) {
			if(e) {
				res.statusCode = 500;
        			res.end("500 - " + e || "unhandled error");
			}
			var layer = stack[index++];
			if (!layer) {
				res.statusCode = 404;
        			res.end("404 - Not Found");
			}else{
				try{
					layer(req, res, next);
					next();
				} catch(e) {
					next(e);
				}
				
			}
		}	
		next();
	}

	app.use = function(m) {
		this.stack .push(m);
	}

	return app;
 }

