var request = require("supertest"),
	http = require("http"),
	expect = require("chai").expect;

var express = require("../");

describe("Implement app.use",function() {
	var app;

	var m1 = function() {};
	var m2 = function() {};

	before(function() {
	  app = express();
	});

	it("should be able to add middlewares to stack",function() {
	  app.use(m1)
	  app.use(m2)
	  expect(app.stack).to.deep.equal([m1,m2]);
	});
});

describe("Implement calling the middlewares",function() {
	var app;
	beforeEach(function() {
		app = express();
	});

	it("Should be able to call a single middleware",function(done) {
		var m1 = function(req,res,next) {
			res.end("hello from m1");
		};
		app.use(m1);
		request(app).get("/").expect("hello from m1").end(done);
	});

	it("Should be able to call `next` to go to the next middleware",function(done) {
	var m1 = function(req,res,next) {
	  	next();
	};
	var m2 = function(req,res,next) {
	 	res.end("hello from m2");
	};
	app.use(m1);
	app.use(m2);
	request(app).get("/").expect("hello from m2").end(done);
	});

	it("Should 404 at the end of middleware chain",function(done) {
	  	var m1 = function(req,res,next) {
	    		next();
	  	};
	  	var m2 = function(req,res,next) {
	    		next();
	  	};
	  	app.use(m1);
	  	app.use(m2);
	  	request(app).get("/").expect(404).end(done);
	});

	it("Should 404 if no middleware is added",function(done) {
	  	request(app).get("/").expect(404).end(done);
	});

});

describe("Implement Error Handling", function(){
	var app;
	beforeEach(function() {
		app = new express();
	});

	it("should return 500 for unhandled error", function(done) {
		var m1 = function(req, res, next) {
			next(new Error("biu~biubiu~"));
		}
		app.use(m1);
		request(app).get("/").expect(500).end(done);
	});

	it("should return 500 for uncaught error", function(done) {
		var m1 = function(req, res, next) {
			throw new Error("xiuxiuxiu~");
		}
		app.use(m1);
		request(app).get("/").expect(500).end(done);
	});
});