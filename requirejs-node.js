var path = require("path");
var fs = require("fs");
var http = require("http");
var vm = require("vm");


var debugMode = process.execArgv.some(function (arg) {
    return (arg.indexOf("--debug-brk") === 0);
});

function loadModuleFromHttp(moduleName, url, define) {
    http.get(url, function (res) {
        var body = '';
        res.on('data', function(chunk) {
            body += chunk;
        });
        res.on('end', function() {
            try {
                global.define = define;
                vm.runInContext(body, vm.createContext(global), moduleName);
            }catch(err) {
                console.error("Error while evaluating module " + moduleName + "(" + url + ")");
            }
        });
        res.on('error', function (err) {
            throw err;
        });
    });
}


// This is a temporary support for the "debug" mode
// When the node runs in the debugging mode (--debug-brk), remote modules will be loaded through Node's require()
// and not through eval of the code text
function loadModuleFromHttp_debug(moduleName, url, define) {
    function tryFileName(root) {
        var filename = path.resolve(process.cwd(), root, moduleName);
        if(fs.existsSync(filename + ".js")) {
            return filename;
        } else {
            return null;
        }
    }

    global.define = function () {
        var args = Array.prototype.slice.apply(arguments);
        if(typeof args[0] !== "string") {
            args.unshift(moduleName);
        }
        define.apply(null, args);
    };
    require(tryFileName("libs") || tryFileName("repo-target"));
    delete global.define;
}



function moduleLoader (moduleName, url, define) {
    if(debugMode) {
        console.log("REQUIRING", moduleName, url);
    }
    if(url.slice(0,5) === "http:") {
        if(debugMode) {
            loadModuleFromHttp_debug(moduleName, url, define);
        } else {
            loadModuleFromHttp(moduleName, url, define);
        }
    } else if(url.charAt(0) == "/"){
        define(moduleName, function () {
            return require(moduleName);
        });
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
module.exports = requirejs;