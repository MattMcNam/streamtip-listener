# streamtip-listener
A Node.JS wrapper for the [Streamtip](https://streamtip.com/) API.

### Installation
```
npm install streamtip-listener
```

### Usage
```javascript
const Streamtip = require('streamtip-listener');

let opts = {
  clientId: '12345', // Your Client ID, from the Streamtip account page
  accessToken: '67890' // Account Token, again from the account page
};

var listener = new Streamtip(opts);

listener.on('connected', () => {
  // Successfully connected to Streamtip, but not authenticated yet!
  console.log('connected!');
});

listener.on('authenticated', () => {
  // Now authenticated, we can expect tip alerts to come through
  console.log('authenticated!');
});

listener.on('authenticationFailed', () => {
  // ClientID or Access Token was rejected
  console.log('authentication failed!');
});

listener.on('ratelimited', () => {
  // Too many bad authentications = ratelimited
  console.log('rate limited!');
});

listener.on('newTip', tip => {
  // We got a new tip.
  // 'tip' is an object which matches the description given on the Streamtip API page
  console.log(`new tip! ${tip.username} has tipped ${tip.currencySymbol}${tip.amount}!`);
});

listener.on('error', function(err) {
  // An unexpected error occurred
  console.log(`error! ${err.message}`);
});
```

### Contributing
1. Fork the project
2. Create your feature/fix on a new branch
5. Create a new pull request pointing to that branch

### License
streamtip-listener is copyright (c) Matthew McNamara, and is provided under the MIT license, which is available to read in the [LICENSE][] file.
[license]: LICENSE

Streamtip itself is copyright (c) NightDev, LLC.
