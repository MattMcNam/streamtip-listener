'use strict';

var io = require('socket.io-client'),
    EventEmitter = require('events').EventEmitter,
    request = require('request'),
    util = require('util');

/**
 * Streamtip constructor
 *
 * @param {Object} options
 */
function Streamtip(options) {
    // Makes "new" optional
    if (!(this instanceof Streamtip)) return new Streamtip(options);

    this.options = options;

    // Top tips object (ordered in alert priority)
    //   month > day
    this._top = {
        monthly: {
            id: null,
            cents: null,
            qs: {
                sort_by: 'amount',
                date_from: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
                limit: 1
            }
        },
        daily: {
            id: null,
            cents: 0,
            qs: null
        }
    };

    // Socket.io object
    this._socket = null;

    this.loadTop();
    this.loadSocketIO();
}

util.inherits(Streamtip, EventEmitter);

/**
 * Loads the top tips (types defined in constructor)
 */
Streamtip.prototype.loadTop = function() {
    var topPeriods = Object.keys(this._top);
    var _self = this;

    topPeriods.forEach(function(period) {
        if(_self._top[period].qs === null) return;

        request.get({
            url: 'https://streamtip.com/api/tips',
            headers: {
                'Authorization': _self.options.clientId + ' ' + _self.options.accessToken
            },
            qs: _self._top[period].qs,
            json: true,
            strictSSL: true
        }, function(err, res, body) {
            if (err) {
                return self.emit('error', err);
            }

            if (res.statusCode !== 200) {
                return self.emit('error', new Error('Unable to fetch ' + period + ' top: ' + res.statusCode));
            }

            if (body._count === 0) return;

            _self._top[period].id = body.tips[0]._id;
            _self._top[period].cents = body.tips[0].cents;
            _self.emit('newTop', period, _self._top[period]);
        });
    });
};

/**
 * Loads the socket.io client
 */
Streamtip.prototype.loadSocketIO = function() {
    if(this._socket) return;

    var _self = this;

    this._socket = io.connect('https://streamtip.com/', {
        multiplex: false,
        query: 'client_id=' + this.options.clientId + '&access_token=' + this.options.accessToken
    });

    this._socket.on('connect', function() {
        _self.emit('connected');
    });

    this._socket.on('authenticated', function() {
        _self.emit('authenticated');
    });

    this._socket.on('error', function(err) {
        if (err === '401::Access Denied::') {
            _self.emit('authenticationFailed');
        } else if (err === '429::Too Many Requests::') {
            // Too many bad authentications = ratelimited
            _self.emit('ratelimited');
        } else if (err.message === 'xhr poll error') {
            // ignoring xhr poll error, socket.io will reconnect
        } else {
            _self.emit('error', err);
        }
    });

    this._socket.on('newTip', function (data) {
        _self.compareTop(data, function(tip) {
            _self.emit('newTip', tip);
        });
    });
};

/**
 * Compares new tip to top tips (and updates the top tips object)
 *
 * @param {Object} tip
 * @param {Function} callback
 */
Streamtip.prototype.compareTop = function(tip, callback) {
    var topPeriods = Object.keys(this._top);
    var _self = this;

    var top = null;
    var updated = false;

    topPeriods.forEach(function(period) {
        var periodObj = _self._top[period];

        // Same tip being re-emitted
        if (periodObj.id === tip._id) return;

        // Tip is less than top of period
        if (periodObj.cents >= tip.cents) return;

        // Only fill in top once
        if(!updated) {
            top = period;
            updated = true;

            // If a donation is top for a given period, it must also be top for all periods shorter than it
            var periods = Object.keys(_self._top);
            var periodIdx = periods.indexOf(period);
            var targetPeriods = periods.slice(periodIdx);
            targetPeriods.forEach(function(period) {
                _self._top[period] = tip;
            });
        }
    });

    tip.top = top;
    if (top) _self.emit('newTop', top, tip);
    callback(tip);
};

/**
 * Reset a period for top donation (day, month)
 *
 * @param {String} period
 */
Streamtip.prototype.resetTop = function(period) {
    var _self = this;
    if (!_self._top.hasOwnProperty(period)) {
        throw new Error('Invalid period "' + period + '"')
    }

    _self._top[period] = {};
};

module.exports = Streamtip;
