var path = require("path");
var fs = require("fs");
var http = require("http");
var vm = require("vm");

var requireAPI = {};

function executeModule(moduleName, moduleContent) {
    var scriptContext = vm.createContext({
        "define": function () {
            var argsArr = Array.prototype.slice.apply(arguments);
            if(typeof argsArr[0] !== "string") {
                argsArr.unshift(moduleName);
            }
            requireAPI.define.apply(requireAPI.requirejs, argsArr);
        }
    });
    vm.runInContext(moduleContent, scriptContext, moduleName);
}

function nodeLoader (context, moduleName, url, done) {
    http.get(url, function (res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            executeModule(moduleName, body);
            done();
        });
    });
}

var context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.resolve(__dirname, "require.js")), context);


requireAPI.requirejs = context.requirejs;
requireAPI.requirejs.fallbackLoader = nodeLoader;
requireAPI.require = context.require;
requireAPI.define = context.define;
module.exports = requireAPI;
