var http = require("http");
var Layer = require("lib/layer")
module.exports = express = function() {
	var app = function(req, res, next) {
		app.handle(req, res, next);
	}
	app.listen = function(port, callback) {
		return http.createServer(this).listen(port, callback);
	}

	app.stack = [];

	app.handle = function(req, res, out) {
		var index = 0, stack = this.stack;
		function next(err) {
			var layer = stack[index++];
			if (!layer) {
				if(out){
					return out(err);
				} else  {
					res.statusCode = err ? 500 : 404;
      				 	res.end();
				}
			} else {
				try{
					if (!layer.match(req.url)) return next(err);
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
				} catch(e) {
					next(e);
				}
			}
		}	
		next();
	}

	app.use = function(path, m) {
		if (typeof path == "function"){
			m = path;
			path = "/";
		};
		var layer = new Layer(path, m);
		this.stack .push(layer);
	}

	return app;
 }

