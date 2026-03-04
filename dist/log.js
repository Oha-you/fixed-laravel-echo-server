"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = void 0;
var colors = require('colors');
colors.setTheme({
    silly: 'rainbow',
    input: 'grey',
    verbose: 'cyan',
    prompt: 'grey',
    info: 'cyan',
    data: 'grey',
    help: 'cyan',
    warn: 'yellow',
    debug: 'blue',
    error: 'red',
    h1: 'grey',
    h2: 'yellow'
});
var Log = (function () {
    function Log() {
    }
    Log.title = function (message) {
        console.log(colors.green.bold(message));
    };
    Log.subtitle = function (message) {
        console.log(colors.h2.bold(message));
    };
    Log.info = function (message, logTime) {
        if (logTime === void 0) { logTime = false; }
        if (logTime)
            console.log(colors.info("[".concat(new Date().toISOString(), "] - ").concat(message)));
        else
            console.log(colors.info(message));
    };
    Log.success = function (message, logTime) {
        if (logTime === void 0) { logTime = false; }
        if (logTime)
            console.log("[".concat(new Date().toISOString(), "] - ").concat(colors.green('\u2714 '), " ").concat(message));
        else
            console.log(colors.green('\u2714 '), message);
    };
    Log.error = function (message, logTime) {
        if (logTime === void 0) { logTime = false; }
        if (logTime)
            console.log(colors.error("[".concat(new Date().toISOString(), "] - ").concat(message)));
        else
            console.log(colors.error(message));
    };
    Log.warning = function (message, logTime) {
        if (logTime === void 0) { logTime = false; }
        if (logTime)
            console.log(colors.warn("[".concat(new Date().toISOString(), "] - \u26A0 ").concat(message)));
        else
            console.log(colors.warn('\u26A0 ' + message));
    };
    return Log;
}());
exports.Log = Log;
