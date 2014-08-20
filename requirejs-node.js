var path = require("path");
var fs = require("fs");
var http = require("http");
var vm = require("vm");


function loadModuleFromHttp(moduleName, url, callback) {
    http.get(url, function (res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            callback(null, body);
        });
        res.on('error', function (err) {
            callback(err);
        });
    });
}

function textPlugin() {
    return {
        load: function (moduleName, req, onload, config) {
            var url = req.toUrl(moduleName);
            var loader;

            if (url.slice(0, 5) === "http:") {
                loader = function (callback) {
                    loadModuleFromHttp(moduleName, url, callback);
                }
            } else {
                loader = function(callback) {
                    fs.readFile(url, callback);
                }
            }
            loader(function (err, result) {
                if (err) {
                    throw err;
                } else {
                    onload(result.toString());
                }
            });
        }
    }
}

function moduleLoader (moduleName, url, define) {
    if(url.slice(0,5) === "http:") {
        loadModuleFromHttp(moduleName, url, function (err, result) {
            if(err) {
                throw err;
            } else {
                try {
                    requirejs.sandboxGlobals.define = define;
                    vm.runInContext(result, vm.createContext(requirejs.sandboxGlobals), moduleName);
                } catch(err) {
                    console.error("Error while evaluating module " + moduleName + "(" + url + ")");
                    console.log(err.stack);
                }
            }
        });
    } else {
        if(moduleName.indexOf("/") === -1) {
            url = moduleName;
        }
        var defineWasCalled = false;
        global.define = function () {
            defineWasCalled = true;
            var args = Array.prototype.slice.apply(arguments);
            if(typeof args[0] !== "string") {
                args.unshift(moduleName);
            }
            define.apply(null, args);
        };
        var result = require(url);
        if(result && !defineWasCalled) {
            define(moduleName, function () {
                return result;
            });
        }
        delete global.define;

    }
}

// require.js doesn't have any NodeJS/CommonJS-specific code, so we can't require() it.
// Also, we want to add the 'fallbackLoader' hook to it before exporting it.
var context = vm.createContext(global);

context.requirejsEnv = {
    nextTick: process.nextTick,
    fallbackLoader: moduleLoader
};

vm.runInContext(fs.readFileSync(path.resolve(__dirname, "require.js")), context);

var requirejs = context.requirejs;
requirejs.require = context.require;
requirejs.define = context.define;
requirejs.define.amd = {};

requirejs.define("text", [], textPlugin);

requirejs.sandboxGlobals = {
    define: requirejs.define,
    setTimeout: setTimeout,
    console: console
};
module.exports = requirejs;