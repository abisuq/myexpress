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

	 it("should ignore error handlers when `next` is called without an error",function(done) {
		var m1 = function(req,res,next) {
		  	next();
		}
		var e1 = function(err,req,res,next) {
		  // timeout
		}
		var m2 = function(req,res,next) {
		  	res.end("m2");
		}
		app.use(m1);
		app.use(e1); 
		app.use(m2);
		request(app).get("/").expect("m2").end(done);
	});
});

describe("Implement App Embedding As Middleware",function() {
	var app, subApp;
	beforeEach(function() {
	  	app = new express();
	  	subApp = new express();
	})

	it("should pass unhandled request to parent",function(done) {
		function m2(req,res) {
		  	res.end("m2");
		}
		app.use(subApp);
		app.use(m2);
		request(app).get("/").expect("m2").end(done);
	});

	it("should pass unhandled error to parent",function(done) {
		app = new express();
		subApp = new express();
		function m1(req,res,next) {
			next("m1 error");
		}
		function e1(err,req,res,next) {
			res.end(err);
		}
		subApp.use(m1);
		app.use(subApp);
		app.use(e1);
		request(app).get("/").expect("m1 error").end(done);
	});

});

describe("Implement Path Parameters Extraction", function() {
	var Layer,layer;
	beforeEach(function() {
		Layer = require("../lib/layer");
		layer = new Layer("/foo/:a/:b");
	});
	
	it("should return undefined for unmatched path", function() {
		expect(layer.match("/other")).to.be.undefined;
	});

	it("should return undefined if params are not enough", function() {
		expect(layer.match("/foo/justone")).to.be.undefined;
	});

	it("should return match data for exact match", function() {
		var match = layer.match("/foo/one/another");
		expect(match).to.not.be.undefined;
		expect(match).to.have.property("path", "/foo/one/another");
		expect(match.params).to.deep.equal({a:"one", b:"another"});
	});

	it("should return match data for prefix match", function() {
		var match = layer.match("/foo/one/another/other");
		expect(match).to.not.be.undefined;
		expect(match).to.have.property("path", "/foo/one/another");
		expect(match.params).to.deep.equal({a:"one", b:"another"});
	});
	
	it("should decode uri encoding", function() {
		var match = layer.match("/foo/apple/xiao%20mi");
   		expect(match.params).to.deep.equal({a: "apple", b: "xiao mi"});
	});

	it("should strip trialing slash", function() {
		layer = new Layer("/");
		expect(layer.match("/foo")).to.not.be.undefined;
		expect(layer.match("/")).to.not.be.undefined;

		layer = new Layer("/foo/")
		expect(layer.match("/foo")).to.not.be.undefined;
		expect(layer.match("/foo/")).to.not.be.undefined;
	});

});

describe("req.params", function() {
	var app;
	beforeEach(function() {
		app = new express();
		app.use("/foo/:a/:b", function(req, res, next) {
			res.end(req.params.a + " and "  + req.params.b);
		});
		app.use("/foo", function(req, res, next) {
			res.end("req without params");
		})
	});

})