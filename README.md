# A :revolving_hearts: Happn :package: wrapper library

[![Build Status](https://travis-ci.org/hfreire/happn-wrapper.svg?branch=master)](https://travis-ci.org/hfreire/happn-wrapper)
[![Coverage Status](https://coveralls.io/repos/github/hfreire/happn-wrapper/badge.svg?branch=master)](https://coveralls.io/github/hfreire/happn-wrapper?branch=master)
[![](https://img.shields.io/github/release/hfreire/happn-wrapper.svg)](https://github.com/hfreire/happn-wrapper/releases)
[![Version](https://img.shields.io/npm/v/happn-wrapper.svg)](https://www.npmjs.com/package/happn-wrapper)
[![Downloads](https://img.shields.io/npm/dt/happn-wrapper.svg)](https://www.npmjs.com/package/happn-wrapper) 

> A Happn wrapper library.

### Features
* Uses [Request on Steroids](https://github.com/hfreire/request-on-steroids) to rate limit, retry and circuit break outgoing HTTP requests :white_check_mark: 
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

happn.authorize(facebookAccessToken)
  .then(() => happn.getRecommendations())
  .then(({ results }) => console.log(results))
```

### How to contribute
You can contribute either with code (e.g., new features, bug fixes and documentation) or by [donating 5 EUR](https://paypal.me/hfreire/5). You can read the [contributing guidelines](./docs/CONTRIBUTING.md) for instructions on how to contribute with code. 

All donation proceedings will go to the [Sverige för UNHCR](https://sverigeforunhcr.se), a swedish partner of the [UNHCR - The UN Refugee Agency](http://www.unhcr.org), a global organisation dedicated to saving lives, protecting rights and building a better future for refugees, forcibly displaced communities and stateless people.

### Used by
* [get-me-a-date](https://github.com/hfreire/get-me-a-date) - :heart_eyes: Help me get a :cupid: date tonight :first_quarter_moon_with_face:

### License
Read the [license](./LICENSE.md) for permissions and limitations.
