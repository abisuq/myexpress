var request = require("supertest"),
  http = require("http"),
  expect = require("chai").expect;

var express = require("../");
var makeRoute = require("../lib/route");

describe("Implement calling the middlewares", function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  it("Should be able to call a single middleware", function(done) {
    var m1 = function(req, res, next) {
      res.end("hello from m1");
    };
    app.use(m1);
    request(app).get("/").expect("hello from m1").end(done);
  });

  it("Should be able to call `next` to go to the next middleware", function(done) {
    var m1 = function(req, res, next) {
      next();
    };
    var m2 = function(req, res, next) {
      res.end("hello from m2");
    };
    app.use(m1);
    app.use(m2);
    request(app).get("/").expect("hello from m2").end(done);
  });

  it("Should 404 at the end of middleware chain", function(done) {
    var m1 = function(req, res, next) {
      next();
    };
    var m2 = function(req, res, next) {
      next();
    };
    app.use(m1);
    app.use(m2);
    request(app).get("/").expect(404).end(done);
  });

  it("Should 404 if no middleware is added", function(done) {
    request(app).get("/").expect(404).end(done);
  });

});

describe("Implement Error Handling", function() {
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

  it("should ignore error handlers when `next` is called without an error", function(done) {
    var m1 = function(req, res, next) {
      next();
    }
    var e1 = function(err, req, res, next) {
      // timeout
    }
    var m2 = function(req, res, next) {
      res.end("m2");
    }
    app.use(m1);
    app.use(e1);
    app.use(m2);
    request(app).get("/").expect("m2").end(done);
  });
});

describe("Implement App Embedding As Middleware", function() {
  var app, subApp;
  beforeEach(function() {
    app = new express();
    subApp = new express();
  })

  it("should pass unhandled request to parent", function(done) {
    function m2(req, res) {
      res.end("m2");
    }
    app.use(subApp);
    app.use(m2);
    request(app).get("/").expect("m2").end(done);
  });

  it("should pass unhandled error to parent", function(done) {
    app = new express();
    subApp = new express();

    function m1(req, res, next) {
      next("m1 error");
    }

    function e1(err, req, res, next) {
      res.end(err);
    }
    subApp.use(m1);
    app.use(subApp);
    app.use(e1);
    request(app).get("/").expect("m1 error").end(done);
  });

});

describe("Implement Path Parameters Extraction", function() {
  var Layer, layer;
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
    expect(match.params).to.deep.equal({
      a: "one",
      b: "another"
    });
  });

  it("should return match data for prefix match", function() {
    var match = layer.match("/foo/one/another/other");
    expect(match).to.not.be.undefined;
    expect(match).to.have.property("path", "/foo/one/another");
    expect(match.params).to.deep.equal({
      a: "one",
      b: "another"
    });
  });

  it("should decode uri encoding", function() {
    var match = layer.match("/foo/apple/xiao%20mi");
    expect(match.params).to.deep.equal({
      a: "apple",
      b: "xiao mi"
    });
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

describe("Implement req.params", function() {
  var app;
  before(function() {
    app = new express();
    app.use("/foo/:a", function(req, res, next) {
      res.end(req.params.a);
    });
    app.use("/foo", function(req, res, next) {
      res.end(req.params.a);
    })
  });

  it("should make path parameters accessible in req.params", function(done) {
    request(app).get("/foo/google").expect("google").end(done);
  })

  it("should make {} the default for req.params", function(done) {
    request(app).get("/foo").expect("").end(done);
  });
})

describe("app should have the handle method", function() {
  it("should have the handle method", function() {
    var app = express();
    expect(app.handle).to.be.a("function");
  });
});

describe("Prefix path trimming", function() {
  var app, subapp, barapp;
  beforeEach(function() {
    app = express();
    subapp = express();
    subapp.use("/bar", function(req, res) {
      res.end("embedded app: " + req.url);
    });

    app.use("/foo", subapp);

    app.use("/foo", function(req, res) {
      res.end("handler: " + req.url);
    });
  });

  it("trims request path prefix when calling embedded app", function(done) {
    request(app).get("/foo/bar").expect("embedded app: /bar").end(done);
  });

  it("restore trimmed request path to original when going to the next middleware", function(done) {
    request(app).get("/foo").expect("handler: /foo").end(done);
  });

  describe("ensures leading slash", function() {
    beforeEach(function() {
      barapp = express();
      barapp.use("/", function(req, res) {
        res.end("/bar");
      });
      app.use("/bar", barapp);
    });

    it("ensures that first char is / for trimmed path", function(done) {
      request(app).get("/bar/").expect("/bar").end(done);
    });
  });
});

describe('App get method', function() {
  var app;

  before(function() {
    app = express();
    app.get("/foo", function(req, res) {
      res.end("foo");
    });
  });

  it("should respond for GET request", function(done) {
    request(app).get("/foo").expect("foo").end(done);
  });

  it("should 404 if not GET request", function(done) {
    request(app).post("/foo").expect(404).end(done);
  });

  it("should 404 if not whole path matched", function(done) {
    request(app).get("/foo/bar").expect(404).end(done);
  });

});

describe("All http verbs:", function() {
  var methods = require("methods"),
    app;

  beforeEach(function() {
    app = express();
  });

  methods.forEach(function(method) {
    it("responds to " + method, function(done) {
      app[method]("/foo", function(req, res) {
        res.end("foo");
      });

      if (method == "delete")
        method = "del";

      request(app)[method]("/foo").expect(200).end(done);
    });
  });
});

describe('Add handlers to a route', function() {
  var route, handle1, handle2;
  before(function() {
    route = makeRoute();
    handler1 = function() {};
    handler2 = function() {};
    route.use("get", handler1);
    route.use("post", handler2);
  });

  it("adds multiple handlers to route", function() {
    expect(route.stack).to.have.length(2);
  });

  it("pushes action object to the stacks", function() {
    var action = route.stack[0];
    expect(action).to.have.property("verb", "get");
    expect(action).to.have.property("handler", handler1);
  })
});

describe('Implement Route Handlers Invokation:', function() {
  var app, route;
  beforeEach(function() {
    app = express();
    route = makeRoute();
    app.use(route);
  });

  describe('calling next():', function() {
    it("goes to the next handler", function(done) {
      route.use("get", function(req, res, next) {
        next();
      });
      route.use("get", function(req, res) {
        res.end("handler2");
      });
      request(app).get("/").expect("handler2").end(done);
    });

    it("exits the route if there's no more handler", function(done) {
      request(app).get("/").expect(404).end(done);
    });
  });

  describe("error handling:", function() {
    it("exits the route if there's an error", function(done) {
      route.use("get", function(req, res, next) {
        next(new Error("boom!"));
      });

      route.use("get", function(req, res, next) {
        // would timeout
      });

      request(app).get("/").expect(500).end(done);
    });
  });

  describe("verb matching:", function() {
    beforeEach(function() {
      route.use("get", function(req, res) {
        res.end("got");
      });
      route.use("post", function(req, res) {
        res.end("posted");
      });
    });

    it("matches GET to the get handler", function(done) {
      request(app).get("/").expect("got").end(done);
    });

    it("matches POST to the post handler", function(done) {
      request(app).post("/").expect("posted").end(done);
    });

  });

  describe("match any verb:", function() {
    beforeEach(function() {
      route.use("all", function(req, res) {
        res.end("all");
      });
    });

    it("matches POST to the all handler", function(done) {
      request(app).post("/").expect("all").end(done);
    });

    it("matches GET to the all handler", function(done) {
      request(app).get("/").expect("all").end(done);
    });
  });

  describe("calling next(route):", function() {
    beforeEach(function() {
      route.use("get", function(req, res, next) {
        next('route');
      });
      route.use("get", function() {
        throw new Error("boom");
      });

      app.use(function(req, res) {
        res.end("middleware");
      });
    });

    it("skip remaining handlers", function(done) {
      request(app).get("/").expect("middleware").end(done);
    });
  });

});

describe("Implement Verbs For Route", function() {
  var app, route, methods;
  methods = require("methods").concat("all");

  beforeEach(function() {
    app = express();
    route = makeRoute();
    app.use(route);
  });

  methods.forEach(function(method) {
    it("should respond to " + method, function(done) {
      route[method](function(req, res) {
        res.end("success!");
      });
      if (method === "delete")
        method = "del";
      if (method === "all")
        method = "get";
      request(app)[method]("/").expect(200).end(done);
    });
  });

  it("should be able to chain verbs", function(done) {
    route.get(function(req, res, next) {
      next();
    }).get(function(req, res) {
      res.end("got");
    });
    request(app).get("/").expect("got").end(done);
  });
});

describe("Implement app.route", function(done) {
  var app;

  beforeEach(function() {
    app = express();
  });

  it("can create a new route", function(done) {
    var route = app.route("/foo")
      .get(function(req, res, next) {
        next();
      })
      .get(function(req, res) {
        res.end("foo");
      });

    expect(app.stack).to.have.length(1);

    request(app).get("/foo").expect("foo").end(done);
  });
});

describe("Implement Verbs For App", function(done) {
  var app;
  methods = require("methods").concat("all");

  beforeEach(function() {
    app = express();
  });

  methods.forEach(function(method) {
    it("creates a new route for " + method, function(done) {
      app[method]("/foo", function(req, res) {
        res.end("ok");
      });
      if (method === "delete")
        method = "del";
      if (method === "all")
        method = "get";
      request(app)[method]("/foo").expect(200).end(done);
    });
  });

  it("can chain VERBS", function(done) {
    app.get("/foo", function(req, res) {
      res.end("foo");
    }).get("/bar", function(req, res) {
      res.end("bar");
    })
    expect(app.stack).to.have.length(2);
    request(app).get("/bar").expect("bar").end(done);
  })
});

describe("Monkey patch req and res", function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  it("adds isExpress to req and res", function(done) {
    var _req, _res;
    app.use(function(req, res) {
      app.monkey_patch(req, res);
      _req = req;
      _res = res;
      res.end(req.isExpress + "," + res.isExpress);
    });

    request(app).get("/").expect("true,true").end(function() {
      expect(_res).to.not.have.ownProperty('isExpress');
      expect(_req).to.not.have.ownProperty('isExpress');
      done();
    });
  });
});

describe("Monkey patch before serving", function() {
  var app;
  beforeEach(function() {
    app = express();
    app.use(function(req, res) {
      res.end(req.isExpress + "," + res.isExpress);
    });
  });

  it("adds isExpress to req and res", function(done) {
    request(app).get("/").expect("true,true").end(done);
  });
});

describe("Setting req.app", function() {
  var app;
  beforeEach(function() {
    app = express();

  });

  it("sets req.app when entering an app", function(done) {
    var _app;
    app.use(function(req, res) {
      _app = req.app;
      res.end("ok");
    });
    request(app).get("/").expect(200).end(function() {
      expect(_app).to.equal(app);
      done();
    });
  });

  it("resets req.app to parent app when exiting a subapp", function(done) {
    var _app, _subapp;
    var subapp = express();

    subapp.use(function(req, res, next) {
      _subapp = req.app; // => subapp
      next();
    });
    app.use(subapp);
    app.use(function(req, res) {
      _app = req.app;
      res.end("ok");
    });

    request(app).get("/").expect(200).end(function() {
      expect(_app).to.equal(app, "req.app is not restored to parent");
      expect(_subapp).to.equal(subapp);
      done();
    });
  });
});

describe("req.res and res.req", function() {
  beforeEach(function() {
    app = express();
  });

  it("makes request and response accessible to each other", function(done) {
    var _res, _req;
    app.use(function(req, res) {
      _res = res;
      _req = req;
      res.end("ok");
    });

    request(app).get("/").end(function() {
      expect(_res.req).to.equal(_req, "res.req is not request");
      expect(_req.res).to.equal(_res, "req.res is not response");
      done();
    });
  });
});

describe("HTTP redirect:", function() {
  beforeEach(function() {
    app = express();
    app.use("/foo", function(req, res) {
      res.redirect("/baz"); // default is 302
    });
    app.use("/bar", function(req, res) {
      res.redirect(301, "/baz");
    });
  });

  it("redirects with 302 by default", function(done) {
    request(app).get("/foo")
      .expect(302)
      .expect("Location", "/baz").end(done);
  });

  it("redirects with the given status code", function(done) {
    request(app).get("/bar")
      .expect(301)
      .expect("Location", "/baz").end(done);
  });

  it("returns empty body", function(done) {
    request(app).get("/foo")
      .expect("")
      .expect("Content-Length", 0).end(done);
  });
});

describe("Setting Content-Type", function() {
  var app;
  beforeEach(function() {
    app = express();
  });

  it("sets the content-type", function(done) {
    app.use(function(req, res) {
      res.type("json");
      res.end("[1,2,3]");
    });

    request(app).get("/")
      .expect("Content-Type", "application/json")
      .expect("[1,2,3]").end(done);
  });

  it("sets the default content type", function(done) {
    app.use(function(req, res) {
      res.default_type("text");
      res.default_type("json");
      res.end("[1,2,3]");
    });

    request(app).get("/")
      .expect("Content-Type", "text/plain")
      .expect("[1,2,3]").end(done);
  });
});

describe("req.format", function() {
  var app;
  beforeEach(function() {
    app = express();
  });
  describe("Respond with different formats", function() {
    beforeEach(function() {
      app.use(function(req, res) {
        res.format({
          text: function() {
            res.end("text hello");
          },

          html: function() {
            res.end("html <b>hello</b>");
          }
        });
      });
    });

    it("responds to text request", function(done) {
      request(app).get("/")
        .set("Accept", "text/plain, text/html")
        .expect("text hello")
        .expect("Content-Type", "text/plain")
        .end(done);
    });

    it("responds to html request", function(done) {
      request(app).get("/")
        .set("Accept", "text/html, text/html")
        .expect("html <b>hello</b>")
        .expect("Content-Type", "text/html")
        .end(done);
    });
  });

  it("responds with 406 if there is no matching type", function(done) {
    app.use(function(req, res) {
      res.format({});
    });

    request(app).get("/").set("Accept", "text/html, text/html")
      .expect(406).end(done);
  });
});

describe("res.send:", function() {
  var app;
  beforeEach(function() {
    app = express();
  })

  describe("support buffer and string body:", function() {
    beforeEach(function() {
      app.use("/buffer", function(req, res) {
        res.send(new Buffer("binary data"));
        // Content-Type: application/octet-stream
      });

      app.use("/string", function(req, res) {
        res.send("string data");
        // Content-Type: text/html
      });

      app.use("/json", function(req, res) {
        res.type("json");
        res.send("[1,2,3]");
        // Content-Type: application/json
      });
    });

    it("responds to buffer", function(done) {
      request(app).get("/buffer")
        .expect("binary data")
        .expect("Content-Type", "application/octet-stream")
        .end(done);
    });

    it("responds to string", function(done) {
      request(app).get("/string")
        .expect("string data")
        .expect("Content-Type", "text/html")
        .end(done);
    });

    it("should not override existing content-type", function(done) {
      request(app).get("/json")
        .expect("[1,2,3]")
        .expect("Content-Type", "application/json")
        .end(done);
    });
  });
  describe("sets content-length:", function() {
    beforeEach(function() {
      app.use("/buffer", function(req, res) {
        res.send(new Buffer("abc"));
      });

      app.use("/string", function(req, res) {
        res.send("你好吗");
      });
    });

    it("responds with the byte length of unicode string", function(done) {
      request(app).get("/string")
        .expect("Content-Length", 9).end(done);
    });

    it("responds with the byte length of buffer", function(done) {
      request(app).get("/buffer")
        .expect("Content-Length", 3).end(done);
    });
  });
  describe("sets status code:", function() {
    beforeEach(function() {
      app.use("/foo", function(req, res) {
        res.send("foo ok"); // default status is 200
      });
      app.use("/bar", function(req, res) {
        res.send(201, "bar created");
      });
      app.use("/201", function(req, res) {
        res.send(201);
      });
    });

    it("defaults status code to 200", function(done) {
      request(app).get("/foo").expect(200, "foo ok").end(done);
    });

    it("can respond with a given status code", function(done) {
      request(app).get("/bar").expect(201, "bar created").end(done);
    });

    it("reponds with default status code body is only status code is given", function(done) {
      request(app).get("/201").expect(201, "Created").end(done);
    });
  });
  describe("JSON response:", function() {
    beforeEach(function() {
      app.use(function(req, res) {
        res.send({
          foo: [1, 2, 3]
        });
      });
    });

    it("returns a JSON as response", function(done) {
      request(app).get("/")
        .expect('{"foo":[1,2,3]}')
        .expect("Content-Type", "application/json")
        .end(done);
    })
  });
});