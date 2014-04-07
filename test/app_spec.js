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

});