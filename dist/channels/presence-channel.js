"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PresenceChannel = void 0;
var database_1 = require("./../database");
var log_1 = require("./../log");
var _ = require("lodash");
var PresenceChannel = (function () {
    function PresenceChannel(io, options) {
        this.io = io;
        this.options = options;
        this.queues = {};
        this.db = new database_1.Database(options);
    }
    PresenceChannel.prototype.getMembers = function (channel) {
        return this.db.get(channel + ":members").then(function (members) { return members || []; });
    };
    PresenceChannel.prototype.isMember = function (members, member) {
        return members.some(function (m) { return m.user_id == member.user_id; });
    };
    PresenceChannel.prototype.removeInactive = function (channel, members) {
        var _this = this;
        return this.io.of("/").in(channel).fetchSockets().then(function (clients) {
            members = members.filter(function (member) { return clients.find(function (client) { return client.id == member.socketId; }) != null; });
            _this.db.set(channel + ":members", members);
            return members;
        });
    };
    PresenceChannel.prototype.queue = function (channel, task) {
        var _this = this;
        var previous = this.queues[channel] || Promise.resolve();
        var next = previous.then(task).catch(function (error) {
            log_1.Log.error("Presence channel ".concat(channel, ": ").concat(error && error.stack ? error.stack : error));
        });
        this.queues[channel] = next;
        next.then(function () {
            if (_this.queues[channel] === next)
                delete _this.queues[channel];
        });
        return next;
    };
    PresenceChannel.prototype.join = function (socket, channel, member) {
        var _this = this;
        if (!member) {
            if (this.options.devMode)
                log_1.Log.error("Unable to join channel. Member data for presence channel missing");
            return Promise.resolve();
        }
        log_1.Log.info("".concat(socket.id, " - ").concat(member.user_id, " - Joining to presence channel ").concat(channel), true);
        return this.queue(channel, function () {
            return _this.getMembers(channel)
                .then(function (members) { return _this.removeInactive(channel, members); })
                .then(function (members) {
                if (!socket.connected)
                    return;
                var is_member = _this.isMember(members, member);
                member.socketId = socket.id;
                members = members.filter(function (m) { return m.socketId != socket.id; });
                members.push(member);
                _this.db.set(channel + ":members", members);
                _this.onSubscribed(socket, channel, _.uniqBy(members.slice().reverse(), "user_id"));
                if (!is_member)
                    _this.onJoin(socket, channel, member);
            });
        });
    };
    PresenceChannel.prototype.leave = function (socket, channel) {
        var _this = this;
        return this.queue(channel, function () {
            return _this.getMembers(channel).then(function (members) {
                var member = members.find(function (m) { return m.socketId == socket.id; });
                if (!member)
                    return;
                members = members.filter(function (m) { return m.socketId != socket.id; });
                return _this.removeInactive(channel, members).then(function (members) {
                    if (!_this.isMember(members, member)) {
                        delete member.socketId;
                        _this.onLeave(channel, member);
                    }
                });
            });
        });
    };
    PresenceChannel.prototype.onJoin = function (socket, channel, member) {
        this.options.echoServer.broadcast(channel, {
            socket: socket.id,
            event: "presence:joining",
            data: member,
        });
    };
    PresenceChannel.prototype.onLeave = function (channel, member) {
        this.options.echoServer.broadcast(channel, {
            event: "presence:leaving",
            data: member,
        });
    };
    PresenceChannel.prototype.onSubscribed = function (socket, channel, members) {
        this.io.to(socket.id).emit("presence:subscribed", channel, members);
    };
    return PresenceChannel;
}());
exports.PresenceChannel = PresenceChannel;
