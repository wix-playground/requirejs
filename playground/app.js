var requirejs = require("../requirejs-node");


requirejs.requirejs.config({
    "baseUrl": "http://localhost:9080/playground"
});

requirejs.requirejs(["testModule"], function (mrMonkey) {
    debugger;
});