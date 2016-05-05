'use strict';

const EventEmitter = require('events');
const io = require('socket.io-client');
const util = require('util');

function Streamtip(options) {
    // Makes "new" optional
    if (!(this instanceof Streamtip)) return new Streamtip(options);

    this.accessToken = options.accessToken;
    this.clientId = options.clientId;
    this.api = require('./api')(this.clientId, this.accessToken);
    this._socket = this._setupSocket();
}

util.inherits(Streamtip, EventEmitter);

Streamtip.prototype._setupSocket = function() {
    let socket = io.connect('https://streamtip.com/', {
        multiplex: false,
        query: `client_id=${this.clientId}&access_token=${this.accessToken}`
    });

    socket.on('connect', () => this.emit('connected'));

    socket.on('authenticated', () => this.emit('authenticated'));

    socket.on('error', err => {
        if (err === '401::Access Denied::') {
            this.emit('authenticationFailed');
        } else if (err === '429::Too Many Requests::') {
            // Too many bad authentications = ratelimited
            this.emit('ratelimited');
        } else if (err.message === 'xhr poll error') {
            // ignoring xhr poll error, socket.io will reconnect
        } else {
            this.emit('error', err);
        }
    });

    socket.on('newTip', tip => this.emit('newTip', tip));

    return socket;
};

module.exports = Streamtip;
