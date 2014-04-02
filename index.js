module.exports = express = function (){
	var myexpress = function(req, res) {
		res.statusCode = 404;
		res.end();
	}
	return myexpress;
}