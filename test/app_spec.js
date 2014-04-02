var request = require("supertest"),
	http = require("http");

var express = require("../");

describe("app", function() {
	var app = express();
	describe("create http server", function() {
		it("respond to /foo with 404", function(done) {
			request(app).get('/foo').expect(404, done);
		});
	});
});