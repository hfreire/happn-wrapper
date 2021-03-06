/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const BASE_URL = 'https://api.happn.fr'

const _ = require('lodash')
const Promise = require('bluebird')

const { HappnNotAuthorizedError } = require('./errors')

const Request = require('request-on-steroids')

const responseHandler = ({ statusCode, statusMessage, body }) => {
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
  'request-on-steroids': {
    request: {
      headers: {
        'User-Agent': 'happn/20.15.0 android/23'
      }
    },
    perseverance: {
      retry: {
        max_tries: 2,
        interval: 1000,
        timeout: 16000,
        throw_original: true,
        predicate: (error) => !(error instanceof HappnNotAuthorizedError)
      },
      breaker: { timeout: 12000, threshold: 80, circuitDuration: 3 * 60 * 60 * 1000 }
    }
  }
}

class HappnWrapper {
  constructor (options = {}) {
    this._options = _.defaultsDeep({}, options, defaultOptions)

    this._request = new Request(_.get(this._options, 'request-on-steroids'))
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

  get circuitBreaker () {
    return this._request.circuitBreaker
  }

  authorize (facebookAccessToken) {
    return Promise.try(() => {
      if (!facebookAccessToken) {
        throw new Error('invalid arguments')
      }
    })
      .then(() => {
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

        return this._request.post(options, responseHandler)
          .then((data) => {
            this._accessToken = data.access_token
            this._refreshToken = data.refresh_token
            this._userId = data.user_id

            return data
          })
      })
  }

  getRecommendations (limit = 16, offset = 0) {
    return Promise.try(() => {
      if (!_.isNumber(limit) || !_.isNumber(offset)) {
        throw new Error('invalid arguments')
      }

      if (!this._accessToken) {
        throw new HappnNotAuthorizedError()
      }
    })
      .then(() => {
        const options = {
          url: `${BASE_URL}/api/users/${this._userId}/crossings`,
          headers: {
            'Authorization': `OAuth="${this._accessToken}"`
          },
          qs: {
            limit,
            offset,
            fields: 'id,modification_date,notification_type,nb_times,notifier.fields(id,type,job,is_accepted,workplace,my_relation,distance,gender,is_charmed,nb_photos,first_name,age,already_charmed,has_charmed_me,availability,is_invited,last_invite_received,profiles.mode(1).width(360).height(640).fields(id,mode,url,width,height))'
          },
          json: true
        }

        return this._request.get(options, responseHandler)
      })
  }

  getAccount () {
    return Promise.try(() => {
      if (!this._accessToken) {
        throw new HappnNotAuthorizedError()
      }
    })
      .then(() => this.getUser(this._userId))
  }

  getUser (userId) {
    return Promise.try(() => {
      if (!userId) {
        throw new Error('invalid arguments')
      }

      if (!this._accessToken) {
        throw new HappnNotAuthorizedError()
      }
    })
      .then(() => {
        const options = {
          url: `${BASE_URL}/api/users/${userId}`,
          headers: {
            'Authorization': `OAuth="${this._accessToken}"`
          },
          qs: {
            fields: 'id,type,about,first_name,age,job,workplace,school,modification_date,profiles.mode(1).width(640).height(864).fields(id,mode,url,width,height),last_meet_position.fields(lat,lon,creation_date),my_relation,is_charmed,distance,gender,spotify_tracks,social_synchronization.fields(instagram),clickable_profile_link,clickable_message_link,availability,is_invited,last_invite_received,has_charmed_me'
          },
          json: true
        }

        return this._request.get(options, responseHandler)
      })
  }

  getUpdates (lastActivityDate) {
    return Promise.try(() => {
      if (!(lastActivityDate instanceof Date) && lastActivityDate) {
        throw new Error('invalid arguments')
      }

      if (!this._accessToken) {
        throw new HappnNotAuthorizedError()
      }
    })
      .then(() => {
        const getMessages = (conversationId) => {
          const options = {
            url: `${BASE_URL}/api/conversations/${conversationId}/messages`,
            headers: {
              'Authorization': `OAuth="${this._accessToken}"`
            },
            qs: {
              fields: 'id,creation_date,message,is_read,sender.fields(id)'
            },
            json: true
          }

          return this._request.get(options, responseHandler)
        }
        const getConversations = (limit = 10, offset = 0) => {
          const options = {
            url: `${BASE_URL}/api/users/${this._userId}/conversations`,
            headers: {
              'Authorization': `OAuth="${this._accessToken}"`
            },
            qs: {
              limit,
              offset,
              fields: 'id,participants.fields(user.fields(id,first_name)),creation_date,modification_date,is_read'
            },
            json: true
          }

          return this._request.get(options, responseHandler)
        }

        const _getConversations = (limit = 10, offset = 0, conversations = []) => {
          return getConversations(limit, offset)
            .then(({ data }) => {
              if (_.isEmpty(data)) {
                return conversations
              }

              const _conversations = _.filter(data, (conversation) => {
                const modificationDate = new Date(conversation[ 'modification_date' ])

                return !lastActivityDate || lastActivityDate.getTime() < modificationDate.getTime()
              })

              conversations = conversations.concat(_conversations)

              if (_conversations.length === limit) {
                return _getConversations(limit, offset + limit, conversations)
              }

              return conversations
            })
        }

        return _getConversations()
          .mapSeries((conversation) => {
            return getMessages(conversation.id)
              .then(({ data }) => {
                conversation.messages = data

                return conversation
              })
          })
          .then((conversations) => { return { conversations } })
      })
  }

  sendMessage (conversationId, message) {
    return Promise.try(() => {
      if (!conversationId || !message) {
        throw new Error('invalid arguments')
      }

      if (!this._accessToken) {
        throw new HappnNotAuthorizedError()
      }
    })
      .then(() => {
        const options = {
          url: `${BASE_URL}/api/users/${this._userId}/conversations/${conversationId}/messages`,
          headers: {
            'Authorization': `OAuth="${this._accessToken}"`
          },
          body: {
            fields: 'message,creation_date,sender.fields(id)',
            message
          },
          json: true
        }

        return this._request.post(options, responseHandler)
      })
  }

  like (userId) {
    return Promise.try(() => {
      if (!userId) {
        throw new Error('invalid arguments')
      }

      if (!this._accessToken) {
        throw new HappnNotAuthorizedError()
      }
    })
      .then(() => {
        const options = {
          url: `${BASE_URL}/api/users/${this._userId}/accepted/${userId}`,
          headers: {
            'Authorization': `OAuth="${this._accessToken}"`
          },
          body: {},
          json: true
        }

        return this._request.post(options, responseHandler)
      })
  }

  pass (userId) {
    return Promise.try(() => {
      if (!userId) {
        throw new Error('invalid arguments')
      }

      if (!this._accessToken) {
        throw new HappnNotAuthorizedError()
      }
    })
      .then(() => {
        const options = {
          url: `${BASE_URL}/api/users/${this._userId}/rejected/${userId}`,
          headers: {
            'Authorization': `OAuth="${this._accessToken}"`
          },
          body: {},
          json: true
        }

        return this._request.post(options, responseHandler)
      })
  }
}

module.exports = HappnWrapper
