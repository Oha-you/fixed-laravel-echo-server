"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisDatabase = void 0;
var log_1 = require("./../log");
var ioredis_1 = require("ioredis");
var RedisDatabase = (function () {
    function RedisDatabase(options) {
        this.options = options;
        this._redis = new ioredis_1.default(options.databaseConfig.redis);
    }
    RedisDatabase.prototype.get = function (key) {
        return this._redis.get(key).then(function (value) { return JSON.parse(value); });
    };
    RedisDatabase.prototype.set = function (key, value) {
        this._redis.set(key, JSON.stringify(value))
            .catch(function (error) { return log_1.Log.error("Redis set ".concat(key, " failed: ").concat(error)); });
        if (this.options.databaseConfig.publishPresence === true && /^presence-.*:members$/.test(key))
            this._redis.publish('PresenceChannelUpdated', JSON.stringify({
                "event": {
                    "channel": key,
                    "members": value
                }
            })).catch(function (error) { return log_1.Log.error("Redis publish ".concat(key, " failed: ").concat(error)); });
    };
    return RedisDatabase;
}());
exports.RedisDatabase = RedisDatabase;
