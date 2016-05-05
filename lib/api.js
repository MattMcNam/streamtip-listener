'use strict';

const request = require('request');

module.exports = function(clientId, accessToken) {
    return {
        getTips(queryParameters, callback) {
            request.get({
                url: 'https://streamtip.com/api/tips',
                headers: { 'Authorization': `${clientId} ${accessToken}` },
                qs: queryParameters,
                json: true,
                strictSSL: true
            }, (err, res, body) => {
                if (err) return callback(err);

                if (res.statusCode !== 200) {
                    return callback(new Error(`Unable to get tips! code: ${res.statusCode} body: ${body}`));
                }

                callback(null, body.tips);
            });
        }
    };
};
