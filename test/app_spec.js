var request = require("supertest"),
	http = require("http"),
	expect = require("chai").expect;

var express = require("../");

describe("app", function() {
	var app = express();
	describe("create http server", function() {
		it("respond to /foo with 404", function(done) {
			request(app).get('/foo').expect(404, done);
		});
	});
	describe("#listen", function() {
		var server;
		before(function(done) {
			server = app.listen(4000, done);
		});
		
    	it("should return an http.Server", function() {
    		expect(server).to.be.instanceof(http.Server);
    	});
    	
    	it("responds to /foo with 404", function(done) {
			request(server).get("/foo").expect(404, done)
		}); 
  	});
}); 