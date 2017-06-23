# A :revolving_hearts: Happn :package: wrapper library

[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/hfreire/happn-wrapper.svg?branch=master)](https://travis-ci.org/hfreire/happn-wrapper)
[![Coverage Status](https://coveralls.io/repos/github/hfreire/happn-wrapper/badge.svg?branch=master)](https://coveralls.io/github/hfreire/happn-wrapper?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/hfreire/happn-wrapper.svg)](https://greenkeeper.io/)
[![](https://img.shields.io/github/release/hfreire/happn-wrapper.svg)](https://github.com/hfreire/happn-wrapper/releases)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Version](https://img.shields.io/npm/v/happn-wrapper.svg)](https://www.npmjs.com/package/happn-wrapper)
[![Downloads](https://img.shields.io/npm/dt/happn-wrapper.svg)](https://www.npmjs.com/package/happn-wrapper) 

A Happn wrapper library.

### Features
* Retries :shit: failing requests in temporary and unexpected system and :boom: network failures :white_check_mark:
* Uses [Brakes](https://github.com/awolden/brakes) circuit breakers to :hand: fail-fast until it is safe to retry :white_check_mark: 
* Supports [Bluebird](https://github.com/petkaantonov/bluebird) :bird: promises :white_check_mark:

### How to install
```
npm install happn-wrapper
```

### How to use

#### Use it in your app
Authorize Facebook account and get recommendations
```javascript
const HappnWrapper = require('happn-wrapper')

const happn = new HappnWrapper()
const facebookAccessToken = 'my-facebook-access-token'
const facebookUserId = 'my-facebook-id'

happn.authorize(facebookAccessToken, facebookUserId)
  .then(() => happn.getRecommendations())
  .then(({ results }) => console.log(results))
```

### Used by
* [get-me-a-date](https://github.com/hfreire/get-me-a-date) - :heart_eyes: Help me get a :cupid: date tonight :first_quarter_moon_with_face:
