var http = require("http");
module.exports = express = function() {
	var myexpress = function(req, res) {
		res.statusCode = 404;
		res.end();
	}
	myexpress.listen = function(port, callback) {
		return http.createServer(this).listen(port, callback);
	}
	return myexpress;
 }