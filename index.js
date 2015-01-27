'use strict';

var io = require('socket.io-client'),
    EventEmitter = require('events').EventEmitter,
    util = require('util');

function StreamTip(options) {
    this.options = options;

    var self = this;

    this._socket = io.connect('https://streamtip.com', {
        multiplex: false,
        query: 'client_id='+ this.options.clientId +'&access_token='+ this.options.accessToken
    });

    this._socket.on('connect', function() {
        self.emit('connected');
    });

    this._socket.on('authenticated', function() {
        self.emit('authenticated');
    });

    this._socket.on('error', function(err) {
        if(err === '401::Access Denied::') {
            self.emit('authenticationFailed');
        } else {
            self.emit('error', err);
        }
    });

    this._socket.on('newTip', function (data) {
        self.emit('newTip', data);
    });
}

util.inherits(StreamTip, EventEmitter);

module.exports = StreamTip;
