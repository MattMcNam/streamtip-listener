'use strict';

var chai = require('chai');
var assert = chai.assert;
var request = require('request');

var StreamTip = require('../');

describe('streamtip live api', function() {
    if (!process.env.STREAMTIP_CLIENT_ID ||
        !process.env.STREAMTIP_ACCESS_TOKEN) {
        throw new Error('Please set your STREAMTIP_CLIENT_ID and STREAMTIP_ACCESS_TOKEN environment variables before testing!');
    }

    // Allow 5s max per test for bad connections
    this.timeout(5000);

    var streamtip;
    var options = {
        clientId: process.env.STREAMTIP_CLIENT_ID,
        accessToken: process.env.STREAMTIP_ACCESS_TOKEN
    };

    it('should connect and authenticate with good credentials', function(done) {
        streamtip = new StreamTip(options);

        streamtip.on('connected', function() {
            streamtip.on('authenticated', function() {
                done();
            });
        });
    });

    it('should fail authentication with bad credentials', function(done) {
        var badST = new StreamTip({
            clientId: 'XXXX',
            accessToken: 'YYYYY'
        });

        badST.on('authenticationFailed', function() {
            done();
        });
    });

    var tipId = randInt(1000, 99999);
    var tipsToDelete = [];

    it('should post a notification for new tips', function(done) {
        streamtip.on('newTip', function(tip) {
            if (tip.transactionId !== 'MANUAL' + tipId) return;
            assert.strictEqual(tip.username, 'travis');
            assert.strictEqual(tip.amount, '5.00');
            tipsToDelete.push('MANUAL' + tipId);
            done();
        });

        request.put({
            url: 'https://streamtip.com/api/tips/' + tipId,
            headers: {
                'Authorization': options.clientId + ' ' + options.accessToken
            },
            json: {
                alert: true,
                amount: '5.00',
                username: 'travis'
            }
        }, function(err, response, body) {
            if (response.statusCode !== 200) throw new Error(body.message);
        });
    });

    afterEach(function(done) {
        setTimeout(done, 1000);
    });

    after(function(done) {
        if (tipsToDelete.length === 0) {
            done();
            return;
        }

        tipsToDelete.forEach(function(transactionId, idx, arr) {
            request.del({
                url: 'https://streamtip.com/api/tips/' + transactionId,
                headers: {
                    'Authorization': options.clientId + ' ' + options.accessToken
                }
            }, function(err, response, body) {
                if (response.statusCode !== 200) throw new Error(body.message);
                if (idx === arr.length - 1) {
                    done();
                }
            });
        });
    });

    // From MDN
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
    function randInt(min, max) {
        return Math.floor(Math.random() * (max - min)) + min;
    }
});
