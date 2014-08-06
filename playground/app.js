var requirejs = require("../requirejs-node");


requirejs.config({
    "baseUrl": "http://localhost:9080/playground",
    "sync": true
});

requirejs(["testModule"], function (mrMonkey) {
    debugger;
});