/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const BASE_URL = 'https://api.happn.fr'

const _ = require('lodash')
const Promise = require('bluebird')
const retry = require('bluebird-retry')
const Brakes = require('brakes')

const { HappnNotAuthorizedError } = require('./errors')

const request = require('request')

const handleResponse = ({ statusCode, statusMessage, body }) => {
  if (statusCode >= 300) {
    switch (statusCode) {
      case 401:
      case 410:
        throw new HappnNotAuthorizedError()
      default:
        throw new Error(`${statusCode} ${statusMessage}`)
    }
  }

  let _body = body
  if (_.isString(_body)) {
    _body = JSON.parse(_body)
  }

  if (_body.error_code && _body.error_code !== 0) {
    throw new Error(`${_body.error_code} ${_body.error}`)
  }

  return _body
}

const defaultOptions = {
  request: {
    headers: {
      'User-Agent': 'Happn/19.1.0 AndroidSDK/19'
    }
  },
  retry: { max_tries: 2, interval: 1000, timeout: 12000, throw_original: true },
  breaker: { timeout: 16000, threshold: 80, circuitDuration: 3 * 60 * 60 * 1000 }
}

class HappnWrapper {
  constructor (options = {}) {
    this._options = _.defaultsDeep(options, defaultOptions)

    this._request = Promise.promisifyAll(request.defaults(this._options.request))

    this._breaker = new Brakes(this._options.breaker)

    this._getRequestCircuitBreaker = this._breaker.slaveCircuit((...params) => retry(() => this._request.getAsync(...params), this._options.retry))
    this._postRequestCircuitBreaker = this._breaker.slaveCircuit((...params) => retry(() => this._request.postAsync(...params), this._options.retry))
  }

  set accessToken (accessToken) {
    this._accessToken = accessToken
  }

  get accessToken () {
    return this._accessToken
  }

  set refreshToken (refreshToken) {
    this._refreshToken = refreshToken
  }

  get refreshToken () {
    return this._refreshToken
  }

  set userId (userId) {
    this._userId = userId
  }

  get userId () {
    return this._userId
  }

  authorize (facebookAccessToken) {
    if (!facebookAccessToken) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const options = {
      url: `${BASE_URL}/connect/oauth/token`,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      form: {
        client_id: 'FUE-idSEP-f7AqCyuMcPr2K-1iCIU_YlvK-M-im3c',
        client_secret: 'brGoHSwZsPjJ-lBk0HqEXVtb3UFu-y5l_JcOjD-Ekv',
        grant_type: 'assertion',
        assertion_type: 'facebook_access_token',
        assertion: facebookAccessToken,
        scope: 'mobile_app'
      }
    }

    return this._postRequestCircuitBreaker.exec(options)
      .then((response) => handleResponse(response))
      .then((data) => {
        this._accessToken = data.access_token
        this._refreshToken = data.refresh_token
        this._userId = data.user_id

        return data
      })
  }

  getRecommendations (limit = 10, offset = 0) {
    const options = {
      url: `${BASE_URL}/api/users/${this._userId}/notifications`,
      headers: {
        'Authorization': `OAuth="${this._accessToken}"`
      },
      qs: {
        types: 468,
        limit,
        offset,
        fields: 'id,modification_date,notification_type,nb_times,notifier.fields(id,about,job,is_accepted,birth_date,workplace,my_relation,distance,gender,my_conversation,is_charmed,nb_photos,first_name,last_name,age,profiles.mode(1).width(360).height(640).fields(width,height,mode,url))'
      },
      json: true
    }

    return this._getRequestCircuitBreaker.exec(options)
      .then((response) => handleResponse(response))
  }

  getAccount () {
    return this.getUser(this._userId)
  }

  getUser (userId) {
    if (!userId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const options = {
      url: `${BASE_URL}/api/users/${userId}`,
      headers: {
        'Authorization': `OAuth="${this._accessToken}"`
      },
      qs: {
        fields: 'id,about,job,is_accepted,birth_date,workplace,my_relation,distance,gender,my_conversation,is_charmed,nb_photos,first_name,last_name,age,profiles.mode(1).width(360).height(640).fields(width,height,mode,url)'
      },
      json: true
    }

    return this._getRequestCircuitBreaker.exec(options)
      .then((response) => handleResponse(response))
  }

  getUpdates (limit = 10, offset = 0) {
    const options = {
      url: `${BASE_URL}/api/users/${this._userId}/notifications`,
      headers: {
        'Authorization': `OAuth="${this._accessToken}"`
      },
      qs: {
        types: 473,
        limit,
        offset,
        fields: 'id,modification_date,notification_type,nb_times,notifier.fields(id,about,job,is_accepted,birth_date,workplace,my_relation,distance,gender,my_conversation,is_charmed,nb_photos,first_name,last_name,age,profiles.mode(1).width(360).height(640).fields(width,height,mode,url))'
      },
      json: true
    }

    return this._getRequestCircuitBreaker.exec(options)
      .then((response) => handleResponse(response))
  }

  sendMessage () {
    return Promise.reject(new Error('not implemented'))
  }

  like (userId) {
    if (!userId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const options = {
      url: `${BASE_URL}/api/users/${this._userId}/accepted/${userId}`,
      headers: {
        'Authorization': `OAuth="${this._accessToken}"`
      },
      body: {
        id: userId
      },
      json: true
    }

    return this._postRequestCircuitBreaker.exec(options)
      .then((response) => handleResponse(response))
  }

  pass (userId) {
    if (!userId) {
      return Promise.reject(new Error('invalid arguments'))
    }

    const options = {
      url: `${BASE_URL}/api/users/${this._userId}/rejected/${userId}`,
      headers: {
        'Authorization': `OAuth="${this._accessToken}"`
      },
      body: {
        id: userId
      },
      json: true
    }

    return this._postRequestCircuitBreaker.exec(options)
      .then((response) => handleResponse(response))
  }
}

module.exports = HappnWrapper
