"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EchoServer = void 0;
var subscribers_1 = require("./subscribers");
var channels_1 = require("./channels");
var server_1 = require("./server");
var api_1 = require("./api");
var firebase_admin_1 = require("./firebase_admin");
var log_1 = require("./log");
var fs = require("fs");
var axios_1 = require("axios");
var path = require("path");
var packageFile = require('../package.json');
var constants = require('crypto').constants;
var EchoServer = (function () {
    function EchoServer() {
        this.defaultOptions = {
            authHost: 'http://localhost',
            authEndpoint: '/broadcasting/auth',
            clientConnectEndpoint: null,
            clientDisconnectEndpoint: null,
            clients: [],
            database: 'redis',
            databaseConfig: {
                redis: {},
                sqlite: {
                    databasePath: '/database/fixed-laravel-echo-server.sqlite'
                }
            },
            devMode: false,
            host: null,
            port: 6001,
            protocol: "http",
            socketIO: {},
            secureOptions: constants.SSL_OP_NO_TLSv1,
            sslCertPath: '',
            sslKeyPath: '',
            sslCertChainPath: '',
            sslPassphrase: '',
            subscribers: {
                http: true,
                redis: true
            },
            apiOriginAllow: {
                allowCors: false,
                allowOrigin: '',
                allowMethods: '',
                allowHeaders: ''
            },
            firebaseAdmin: {
                enabled: false,
                configSource: null,
                databaseURL: null,
                channel: 'private-firebase_admin',
            },
        };
    }
    EchoServer.prototype.run = function (options, yargs) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.options = Object.assign(_this.defaultOptions, options);
            _this.options.echoServer = _this;
            _this.startup();
            _this.server = new server_1.Server(_this.options);
            _this.server.init().then(function (io) {
                _this.init(io, yargs).then(function () {
                    log_1.Log.info('\nServer ready!\n');
                    resolve(_this);
                }, function (error) { return log_1.Log.error(error); });
            }, function (error) { return log_1.Log.error(error); });
        });
    };
    EchoServer.prototype.init = function (io, yargs) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.channel = new channels_1.Channel(io, _this.options);
            _this.subscribers = {};
            if (_this.options.subscribers.http)
                _this.subscribers.http = new subscribers_1.HttpSubscriber(_this.server.express, _this.options);
            if (_this.options.subscribers.redis)
                _this.subscribers.redis = new subscribers_1.RedisSubscriber(_this.options);
            _this.httpApi = new api_1.HttpApi(io, _this.channel, _this.server.express, _this.options.apiOriginAllow);
            _this.httpApi.init();
            if (_this.options.firebaseAdmin.enabled) {
                if (!_this.options.firebaseAdmin.configSource)
                    log_1.Log.error('Firebase admin service account file path is required\nPlease check your config json file');
                else if (!fs.existsSync(path.join(yargs.argv.dir || process.cwd(), _this.options.firebaseAdmin.configSource)))
                    log_1.Log.error("Firebase admin service account file path not found (\"".concat(path.join(yargs.argv.dir || process.cwd(), _this.options.firebaseAdmin.configSource), "\")"));
                else if (!_this.options.firebaseAdmin.databaseURL)
                    log_1.Log.error('Firebase admin databaseURL is required\nPlease check your config json file');
                else {
                    try {
                        _this.firebaseAdmin = new firebase_admin_1.FirebaseAdmin(_this.options, yargs);
                        _this.firebaseAdmin.init();
                        log_1.Log.success('FirebaseAdmin service is running...');
                    }
                    catch (error) {
                        log_1.Log.error('Cannot init Firebase Admin Service');
                        log_1.Log.error(error);
                    }
                }
            }
            _this.onConnect();
            _this.listen().then(function () { return resolve(undefined); }, function (err) { return log_1.Log.error(err); });
        });
    };
    EchoServer.prototype.startup = function () {
        log_1.Log.title("\n  \u2554\u2550\u2550\u2550\u2557            \u2554\u2557     \u2554\u2557                        \u2554\u2557      \u2554\u2550\u2550\u2550\u2557    \u2554\u2557           \u2554\u2550\u2550\u2550\u2557\n  \u2551\u2554\u2550\u2550\u255D            \u2551\u2551     \u2551\u2551                        \u2551\u2551      \u2551\u2554\u2550\u2550\u255D    \u2551\u2551           \u2551\u2554\u2550\u2557\u2551\n  \u2551\u255A\u2550\u2550\u2557\u2554\u2557\u2554\u2557\u2554\u2557\u2554\u2550\u2550\u2557\u2554\u2550\u255D\u2551     \u2551\u2551   \u2554\u2550\u2550\u2557 \u2554\u2550\u2557\u2554\u2550\u2550\u2557 \u2554\u2557\u2554\u2557\u2554\u2550\u2550\u2557\u2551\u2551      \u2551\u255A\u2550\u2550\u2557\u2554\u2550\u2550\u2557\u2551\u255A\u2550\u2557\u2554\u2550\u2550\u2557     \u2551\u255A\u2550\u2550\u2557\u2554\u2550\u2550\u2557\u2554\u2550\u2557\u2554\u2557\u2554\u2557\u2554\u2550\u2550\u2557\u2554\u2550\u2557\n  \u2551\u2554\u2550\u2550\u255D\u2560\u2563\u255A\u256C\u256C\u255D\u2551\u2554\u2557\u2551\u2551\u2554\u2557\u2551\u2554\u2550\u2550\u2550\u2557\u2551\u2551 \u2554\u2557\u255A \u2557\u2551 \u2551\u2554\u255D\u255A \u2557\u2551 \u2551\u255A\u255D\u2551\u2551\u2554\u2557\u2551\u2551\u2551 \u2554\u2550\u2550\u2550\u2557\u2551\u2554\u2550\u2550\u255D\u2551\u2554\u2550\u255D\u2551\u2554\u2557\u2551\u2551\u2554\u2557\u2551\u2554\u2550\u2550\u2550\u2557\u255A\u2550\u2550\u2557\u2551\u2551\u2554\u2557\u2551\u2551\u2554\u255D\u2551\u255A\u255D\u2551\u2551\u2554\u2557\u2551\u2551\u2554\u255D\n \u2554\u255D\u255A\u2557  \u2551\u2551\u2554\u256C\u256C\u2557\u2551\u2551\u2550\u2563\u2551\u255A\u255D\u2551\u255A\u2550\u2550\u2550\u255D\u2551\u255A\u2550\u255D\u2551\u2551\u255A\u255D\u255A\u2557\u2551\u2551 \u2551\u255A\u255D\u255A\u2557\u255A\u2557\u2554\u255D\u2551\u2551\u2550\u2563\u2551\u255A\u2557\u255A\u2550\u2550\u2550\u255D\u2551\u255A\u2550\u2550\u2557\u2551\u255A\u2550\u2557\u2551\u2551\u2551\u2551\u2551\u255A\u255D\u2551\u255A\u2550\u2550\u2550\u255D\u2551\u255A\u2550\u255D\u2551\u2551\u2551\u2550\u2563\u2551\u2551 \u255A\u2557\u2554\u255D\u2551\u2551\u2550\u2563\u2551\u2551\n \u255A\u2550\u2550\u255D  \u255A\u255D\u255A\u255D\u255A\u255D\u255A\u2550\u2550\u255D\u255A\u2550\u2550\u255D     \u255A\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u2550\u255D\u255A\u255D \u255A\u2550\u2550\u2550\u255D \u255A\u255D \u255A\u2550\u2550\u255D\u255A\u2550\u255D     \u255A\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u255D\u255A\u255D\u255A\u255D\u255A\u2550\u2550\u255D     \u255A\u2550\u2550\u2550\u255D\u255A\u2550\u2550\u255D\u255A\u255D  \u255A\u255D \u255A\u2550\u2550\u255D\u255A\u255D\n----------------------------------------------------------------------------------------------------------\n|                                   Powered By AbdoPrDZ \"Just Code It\";                                  |\n----------------------------------------------------------------------------------------------------------\n");
        log_1.Log.info("version ".concat(packageFile.version, "\n"));
        if (this.options.devMode)
            log_1.Log.warning('Starting server in DEV mode...\n');
        else
            log_1.Log.info('Starting server...\n');
    };
    EchoServer.prototype.stop = function () {
        var _this = this;
        console.log('Stopping the LARAVEL ECHO SERVER');
        var promises = [];
        Object.values(this.subscribers).forEach(function (subscriber) {
            promises.push(subscriber.unsubscribe());
        });
        promises.push(this.server.io.close());
        return Promise.all(promises).then(function () {
            _this.subscribers = {};
            console.log('The FiXED LARAVEL ECHO SERVER server has been stopped.');
        });
    };
    EchoServer.prototype.listen = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            var subscribePromises = Object.values(_this.subscribers).map(function (subscriber) {
                return subscriber.subscribe(function (channel, message) {
                    var _a;
                    if (_this.firebaseAdmin) {
                        var firebaseChannel = (_a = _this.options.firebaseAdmin.channel) !== null && _a !== void 0 ? _a : 'private-firebase_channel';
                        if (channel == firebaseChannel)
                            return _this.firebaseAdmin.onServerEvent(message);
                    }
                    return _this.broadcast(channel, message);
                });
            });
            Promise.all(subscribePromises).then(function () { return resolve(undefined); });
        });
    };
    EchoServer.prototype.find = function (socket_id) {
        var socket = this.server.io.sockets.sockets.get(socket_id);
        return socket.connected ? socket : null;
    };
    EchoServer.prototype.broadcast = function (channel, message) {
        message.socket = message.socket ? this.find(message.socket) : null;
        if (message.socket)
            return this.toOthers(message.socket, channel, message);
        else
            return this.toAll(channel, message);
    };
    EchoServer.prototype.toOthers = function (socket, channel, message) {
        socket.broadcast.to(channel)
            .emit(message.event, channel, message.data);
        return true;
    };
    EchoServer.prototype.toAll = function (channel, message) {
        this.server.io.to(channel)
            .emit(message.event, channel, message.data);
        return true;
    };
    EchoServer.prototype.onConnect = function () {
        var _this = this;
        this.server.io.on('connection', function (socket) {
            _this.onConnected(socket);
            _this.onSubscribe(socket);
            _this.onClientEvent(socket);
            _this.onUnsubscribe(socket);
            _this.onDisconnecting(socket);
            _this.onDisconnected(socket);
        });
    };
    EchoServer.prototype.onConnected = function (socket) {
        log_1.Log.warning("Client ".concat(socket.id, " connected"), true);
        if (this.options.clientConnectEndpoint) {
            var url_1 = path.join(this.options.authHost, this.options.clientConnectEndpoint);
            new Promise(function (resolve, reject) {
                axios_1.default.post(url_1, { socket_id: socket.id }, {
                    headers: socket.handshake.auth ? socket.handshake.auth.headers : {},
                }).then(function (response) {
                    log_1.Log.info("Client connect server request data:\n".concat(JSON.stringify(response.data)), true);
                    resolve(undefined);
                }).catch(function (error) {
                    log_1.Log.error("Client connect server request error\nurl: ".concat(url_1, "\n").concat(error), true);
                });
            });
        }
    };
    EchoServer.prototype.onSubscribe = function (socket) {
        var _this = this;
        socket.on('subscribe', function (data) {
            var _a;
            if (_this.firebaseAdmin) {
                var firebaseChannel = (_a = _this.options.firebaseAdmin.channel) !== null && _a !== void 0 ? _a : 'private-firebase_channel';
                if (data.channel == firebaseChannel)
                    return socket.sockets.to(socket.id).emit('subscription_error', data.channel, 'Invalid channel name');
            }
            _this.channel.join(socket, data);
        });
    };
    EchoServer.prototype.onClientEvent = function (socket) {
        var _this = this;
        socket.on('client event', function (data) {
            _this.channel.clientEvent(socket, data);
        });
    };
    EchoServer.prototype.onUnsubscribe = function (socket) {
        var _this = this;
        socket.on('unsubscribe', function (data) {
            _this.channel.leave(socket, data.channel, 'unsubscribed');
        });
    };
    EchoServer.prototype.onDisconnecting = function (socket) {
        var _this = this;
        socket.on('disconnecting', function (reason) {
            Array.from(socket.rooms).forEach(function (room) { return __awaiter(_this, void 0, void 0, function () {
                return __generator(this, function (_a) {
                    if (typeof room === "string" && room !== socket.id) {
                        this.channel.leave(socket, room, reason);
                    }
                    return [2];
                });
            }); });
        });
    };
    EchoServer.prototype.onDisconnected = function (socket) {
        var _this = this;
        socket.on('disconnect', function (reason) { return __awaiter(_this, void 0, void 0, function () {
            var url_2;
            return __generator(this, function (_a) {
                log_1.Log.warning("Client ".concat(socket.id, " disconnected"), true);
                if (this.options.clientDisconnectEndpoint) {
                    url_2 = path.join(this.options.authHost, this.options.clientDisconnectEndpoint);
                    new Promise(function (resolve, reject) {
                        axios_1.default.post(url_2, { socket_id: socket.id }, {
                            headers: socket.handshake.auth ? socket.handshake.auth.headers : {},
                        }).then(function (response) {
                            log_1.Log.info("Client disconnect server request data:\n".concat(JSON.stringify(response.data)), true);
                            resolve(undefined);
                        }).catch(function (error) {
                            log_1.Log.error("Client disconnect server request error\nurl: ".concat(url_2, "\n").concat(error), true);
                        });
                    });
                }
                return [2];
            });
        }); });
    };
    return EchoServer;
}());
exports.EchoServer = EchoServer;
