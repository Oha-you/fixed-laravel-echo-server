"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSubscriber = void 0;
var ioredis_1 = require("ioredis");
var log_1 = require("./../log");
var RedisSubscriber = (function () {
    function RedisSubscriber(options) {
        this.options = options;
        this._keyPrefix = options.databaseConfig.redis.keyPrefix || '';
        this._redis = new ioredis_1.default(options.databaseConfig.redis);
    }
    RedisSubscriber.prototype.subscribe = function (callback) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this._redis.on('pmessage', function (subscribed, channel, _message) {
                try {
                    var message = JSON.parse(_message);
                    if (_this.options.devMode) {
                        log_1.Log.info("Channel: " + channel);
                        log_1.Log.info("Event: " + message.event);
                    }
                    callback(channel.substring(_this._keyPrefix.length), message);
                }
                catch (e) {
                    if (_this.options.devMode)
                        log_1.Log.error(e);
                }
            });
            _this._redis.psubscribe("".concat(_this._keyPrefix, "*"), function (err, count) {
                if (err)
                    reject('Redis could not subscribe.');
                log_1.Log.success('Listening for redis events...');
                resolve(undefined);
            });
        });
    };
    RedisSubscriber.prototype.unsubscribe = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this._redis.disconnect();
                resolve(undefined);
            }
            catch (e) {
                reject('Could not disconnect from redis -> ' + e);
            }
        });
    };
    return RedisSubscriber;
}());
exports.RedisSubscriber = RedisSubscriber;
