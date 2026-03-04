"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrivateChannel = void 0;
var url = require('url');
var log_1 = require("./../log");
var axios_1 = require("axios");
var PrivateChannel = (function () {
    function PrivateChannel(options) {
        this.options = options;
        this.axios = axios_1.default;
    }
    PrivateChannel.prototype.authenticate = function (socket, data) {
        var options = {
            url: this.authHost(socket) + this.options.authEndpoint,
            form: { socket_id: socket.id, channel_name: data.channel },
            headers: (data.auth && data.auth.headers) ? data.auth.headers : {},
            rejectUnauthorized: false
        };
        if (this.options.devMode)
            log_1.Log.info("Sending auth request to: ".concat(options.url, "\n"), true);
        return this.serverRequest(socket, options);
    };
    PrivateChannel.prototype.authHost = function (socket) {
        var authHosts = (this.options.authHost) ?
            this.options.authHost : this.options.host;
        if (typeof authHosts === "string")
            authHosts = [authHosts];
        var authHostSelected = authHosts[0] || 'http://localhost';
        if (socket.request.headers.referer) {
            var referer = url.parse(socket.request.headers.referer);
            for (var _i = 0, authHosts_1 = authHosts; _i < authHosts_1.length; _i++) {
                var authHost = authHosts_1[_i];
                authHostSelected = authHost;
                if (this.hasMatchingHost(referer, authHost)) {
                    authHostSelected = "".concat(referer.protocol, "//").concat(referer.host);
                    break;
                }
            }
        }
        if (this.options.devMode)
            log_1.Log.error("Preparing authentication request to: ".concat(authHostSelected), true);
        return authHostSelected;
    };
    PrivateChannel.prototype.hasMatchingHost = function (referer, host) {
        return (referer.hostname && referer.hostname.substr(referer.hostname.indexOf('.')) === host) ||
            "".concat(referer.protocol, "//").concat(referer.host) === host ||
            referer.host === host;
    };
    PrivateChannel.prototype.serverRequest = function (socket, options) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            options.headers = _this.prepareHeaders(socket, options);
            var body;
            _this.axios.post(options.url, options.form, {
                headers: options.headers,
            }).then(function (response) {
                if (response.status !== 200) {
                    if (_this.options.devMode) {
                        log_1.Log.warning("".concat(socket.id, " could not be authenticated to ").concat(options.form.channel_name), true);
                        log_1.Log.error(response.data);
                    }
                    reject({ reason: 'Client can not be authenticated, got HTTP status ' + response.status, status: response.status });
                }
                else {
                    if (_this.options.devMode)
                        log_1.Log.info("".concat(socket.id, " authenticated for: ").concat(options.form.channel_name), true);
                    try {
                        body = JSON.parse(response.data);
                    }
                    catch (e) {
                        body = response.data;
                    }
                    resolve(body);
                }
            }).catch(function (error) {
                if (_this.options.devMode) {
                    log_1.Log.error("Error authenticating ".concat(socket.id, " for ").concat(options.form.channel_name), true);
                    log_1.Log.error(error);
                }
                reject({ reason: 'Error sending authentication request.', status: 0 });
            });
        });
    };
    PrivateChannel.prototype.prepareHeaders = function (socket, options) {
        options.headers['Cookie'] = options.headers['Cookie'] || socket.request.headers.cookie;
        options.headers['X-Requested-With'] = 'XMLHttpRequest';
        return options.headers;
    };
    return PrivateChannel;
}());
exports.PrivateChannel = PrivateChannel;
