var requirejs = require("../requirejs-node");


requirejs.config({
    "baseUrl": "http://localhost:9080/playground",
    "sync": true
});

requirejs.define("testModule", "MMMMM");

requirejs([], function () {
    var t0 = process.hrtime();
    requirejs.require(["testModule"], function (mrMonkey) {
        var t1 = process.hrtime(t0);
        console.log(t1[1] / 1e6);
        debugger;
    });


});


