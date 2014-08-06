var path = require("path");
var fs = require("fs");
var http = require("http");
var vm = require("vm");

function nodeLoader (moduleName, url, define) {
    http.get(url, function (res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            vm.runInContext(body, vm.createContext({ define: define }), moduleName);
        });
        res.on('error', function (err) {
            throw err;
        });
    });
}

// require.js doesn't have any NodeJS/CommonJS-specific code, so we can't require() it.
// Also, we want to add the 'fallbackLoader' hook to it before exporting it.
var context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.resolve(__dirname, "require.js")), context);

var requirejs = context.requirejs;
requirejs.require = context.require;
requirejs.define = context.define;
requirejs.fallbackLoader = nodeLoader;

module.exports = requirejs;