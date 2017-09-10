/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable promise/no-callback-in-promise */

const { HappnNotAuthorizedError } = require('../src/errors')

describe('Happn Wrapper', () => {
  let subject
  let request

  before(() => {
    request = td.object([ 'defaults', 'get', 'post' ])
  })

  afterEach(() => td.reset())

  describe('when constructing', () => {
    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should set default request headers', () => {
      const captor = td.matchers.captor()

      td.verify(request.defaults(captor.capture()))

      const options = captor.value
      options.should.have.nested.property('headers.User-Agent', 'happn/20.15.0 android/23')
    })
  })

  describe('when constructing and loading request', () => {
    beforeEach(() => {
      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should create a request with defaults function', () => {
      subject._request.should.have.property('defaults')
      subject._request.defaults.should.be.instanceOf(Function)
    })

    it('should create a request with get function', () => {
      subject._request.should.have.property('get')
      subject._request.get.should.be.instanceOf(Function)
    })

    it('should create a request with post function', () => {
      subject._request.should.have.property('post')
      subject._request.post.should.be.instanceOf(Function)
    })
  })

  describe('when authorizing', () => {
    const facebookAccessToken = 'my-facebook-access-token'
    const facebookUserId = 'my-facebook-user-id'
    const statusCode = 200
    const accessToken = 'my-access-token'
    const refreshToken = 'my-refresh-token'
    const userId = 'my-user-id'
    const body = { access_token: accessToken, refresh_token: refreshToken, user_id: userId }
    const response = { statusCode, body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()

      return subject.authorize(facebookAccessToken, facebookUserId)
    })

    it('should do a post request to https://api.happn.fr/connect/oauth/token', () => {
      const captor = td.matchers.captor()

      td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

      const options = captor.value
      options.should.have.property('url', 'https://api.happn.fr/connect/oauth/token')
    })

    it('should do a post request with form', () => {
      const captor = td.matchers.captor()

      td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

      const options = captor.value
      options.should.have.nested.property('form.client_id', 'FUE-idSEP-f7AqCyuMcPr2K-1iCIU_YlvK-M-im3c')
      options.should.have.nested.property('form.client_secret', 'brGoHSwZsPjJ-lBk0HqEXVtb3UFu-y5l_JcOjD-Ekv')
      options.should.have.nested.property('form.grant_type', 'assertion')
      options.should.have.nested.property('form.assertion_type', 'facebook_access_token')
      options.should.have.nested.property('form.assertion', facebookAccessToken)
      options.should.have.nested.property('form.scope', 'mobile_app')
    })

    it('should set access token', () => {
      subject.accessToken.should.be.equal(accessToken)
    })

    it('should set refresh token', () => {
      subject.refreshToken.should.be.equal(refreshToken)
    })

    it('should set user id', () => {
      subject.userId.should.be.equal(userId)
    })
  })

  describe('when authorizing with invalid facebook access token', () => {
    const facebookAccessToken = undefined

    beforeEach(() => {
      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should reject with invalid arguments error', () => {
      return subject.authorize(facebookAccessToken)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when getting recommendations', () => {
    const userId = 'my-user-id'
    const statusCode = 200
    const body = {}
    const response = { statusCode, body }
    const accessToken = 'my-access-token'

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
      subject.accessToken = accessToken
      subject.userId = userId
    })

    it('should do a get request to https://api.happn.fr/api/users/my-user-id/notifications', () => {
      return subject.getRecommendations()
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.get(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.happn.fr/api/users/my-user-id/crossings')
        })
    })

    it('should do a get request with query string', () => {
      return subject.getRecommendations()
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.get(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.nested.property('qs.limit')
          options.should.have.nested.property('qs.offset')
          options.should.have.nested.property('qs.fields', 'id,modification_date,notification_type,nb_times,notifier.fields(id,about,job,is_accepted,birth_date,workplace,my_relation,distance,gender,my_conversation,is_charmed,nb_photos,first_name,age,profiles.mode(1).width(360).height(640).fields(width,height,mode,url))')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.getRecommendations()
        .then((data) => {
          data.should.be.eql(body)
        })
    })
  })

  describe('when getting recommendations and not authorized', () => {
    const statusCode = 401
    const body = {}
    const response = { statusCode, body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should reject with happn not authorized error', () => {
      return subject.getRecommendations()
        .catch((error) => {
          error.should.be.instanceOf(HappnNotAuthorizedError)
        })
    })
  })

  describe('when getting account', () => {
    const userId = 'my-user-id'
    const statusCode = 200
    const body = {}
    const response = { statusCode, body }
    const accessToken = 'my-access-token'

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
      subject.accessToken = accessToken
      subject.userId = userId
    })

    it('should do a get request to https://api.happn.fr/api/users/my-user-id', () => {
      return subject.getAccount()
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.get(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.happn.fr/api/users/my-user-id')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.getAccount()
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when getting account and not authorized', () => {
    beforeEach(() => {
      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should reject with tinder not authorized error', (done) => {
      subject.getAccount()
        .catch((error) => {
          error.should.be.instanceOf(HappnNotAuthorizedError)

          done()
        })
    })
  })

  describe('when getting user', () => {
    const userId = 'my-user-id'
    const statusCode = 200
    const body = {}
    const response = { statusCode, body }
    const accessToken = 'my-access-token'

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
      subject.accessToken = accessToken
    })

    it('should do a get request to https://api.happn.fr/api/users/my-user-id', () => {
      return subject.getUser(userId)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.get(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.happn.fr/api/users/my-user-id')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.getUser(userId)
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when getting user and not authorized', () => {
    const userId = 'my-user-id'

    beforeEach(() => {
      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should reject with tinder not authorized error', (done) => {
      subject.getUser(userId)
        .catch((error) => {
          error.should.be.instanceOf(HappnNotAuthorizedError)

          done()
        })
    })
  })

  describe('when getting user with invalid id', () => {
    const userId = undefined
    const accessToken = 'my-access-token'

    beforeEach(() => {
      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
      subject.accessToken = accessToken
    })

    it('should reject with invalid arguments error', () => {
      return subject.getUser(userId)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when getting updates without a last activity date', () => {
    const userId = 'my-user-id'
    const statusCode = 200
    const conversationId = 'my-conversation-id'
    const body = { data: [ { id: conversationId } ] }
    const conversationsResponse = { statusCode, body }
    const messagesResponse = { statusCode, body: {} }
    const accessToken = 'my-access-token'

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.contains({ url: 'https://api.happn.fr/api/users/my-user-id/conversations' })), { ignoreExtraArgs: true }).thenCallback(null, conversationsResponse)
      td.when(request.get(td.matchers.contains({ url: 'https://api.happn.fr/api/conversations/my-conversation-id/messages' })), { ignoreExtraArgs: true }).thenCallback(null, messagesResponse)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
      subject.accessToken = accessToken
      subject.userId = userId
    })

    it('should do a get request to https://api.happn.fr/api/users/my-user-id/conversations', () => {
      return subject.getUpdates()
        .then(() => {
          td.verify(request.get(td.matchers.contains({
            url: 'https://api.happn.fr/api/users/my-user-id/conversations',
            qs: {
              limit: 10,
              offset: 0,
              fields: 'id,participants.fields(user.fields(id,first_name)),creation_date,modification_date,is_read'
            }
          })), { ignoreExtraArgs: true, times: 1 })
        })
    })
  })

  describe('when getting updates with a last activity date', () => {
    const userId = 'my-user-id'
    const statusCode = 200
    const conversationId = 'my-conversation-id'
    const body = { data: [ { id: conversationId, modification_date: '2017-05-02T00:00:00Z' } ] }
    const conversationsResponse = { statusCode, body }
    const messagesResponse = { statusCode, body: {} }
    const accessToken = 'my-access-token'

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.contains({ url: 'https://api.happn.fr/api/users/my-user-id/conversations' })), { ignoreExtraArgs: true }).thenCallback(null, conversationsResponse)
      td.when(request.get(td.matchers.contains({ url: 'https://api.happn.fr/api/conversations/my-conversation-id/messages' })), { ignoreExtraArgs: true }).thenCallback(null, messagesResponse)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
      subject.accessToken = accessToken
      subject.userId = userId
    })

    it('should do a get request to https://api.happn.fr/api/users/my-user-id/conversations', () => {
      return subject.getUpdates(new Date())
        .then(() => {
          td.verify(request.get(td.matchers.contains({
            url: 'https://api.happn.fr/api/users/my-user-id/conversations',
            qs: {
              limit: 10,
              offset: 0,
              fields: 'id,participants.fields(user.fields(id,first_name)),creation_date,modification_date,is_read'
            }
          })), { ignoreExtraArgs: true, times: 1 })
        })
    })

    it('should not do a get request to https://api.happn.fr/api/conversations/my-conversation-id/messages', () => {
      return subject.getUpdates(new Date())
        .then(() => {
          td.verify(request.get(td.matchers.contains({ url: 'https://api.happn.fr/api/conversations/my-conversation-id/messages' })), {
            ignoreExtraArgs: true,
            times: 0
          })
        })
    })
  })

  describe('when getting updates and not authorized', () => {
    beforeEach(() => {
      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should reject with tinder not authorized error', (done) => {
      subject.getUpdates()
        .catch((error) => {
          error.should.be.instanceOf(HappnNotAuthorizedError)

          done()
        })
    })
  })

  describe('when sending message', () => {
    const userId = 'my-user-id'
    const conversationId = 'my-conversation-id'
    const message = 'my-message'
    const statusCode = 200
    const body = {}
    const response = { statusCode, body }
    const accessToken = 'my-access-token'

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
      subject.accessToken = accessToken
      subject.userId = userId
    })

    it('should do a post request to https://api.happn.fr/api/users/my-user-id/conversations/my-conversation-id/messages', () => {
      return subject.sendMessage(conversationId, message)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', `https://api.happn.fr/api/users/my-user-id/conversations/${conversationId}/messages`)
        })
    })

    it('should do a get request with body', () => {
      return subject.sendMessage(conversationId, message)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.nested.nested.property('body.fields', 'message,creation_date,sender.fields(id)')
          options.should.have.nested.nested.property('body.message', message)
        })
    })
  })

  describe('when sending message and not authorized', () => {
    const matchId = 'my-match-id'
    const message = 'my-message'

    beforeEach(() => {
      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should reject with tinder not authorized error', (done) => {
      subject.sendMessage(matchId, message)
        .catch((error) => {
          error.should.be.instanceOf(HappnNotAuthorizedError)

          done()
        })
    })
  })

  describe('when liking', () => {
    const userId = 'my-user-id'
    const userIdToLike = 'my-user-id-to-like'
    const statusCode = 200
    const body = { likes_remaining: 100 }
    const response = { statusCode, body }
    const accessToken = 'my-access-token'

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
      subject.accessToken = accessToken
      subject.userId = userId
    })

    it('should do a post request to https://api.happn.fr/api/users/my-user-id/accepted/my-user-id-to-like', () => {
      return subject.like(userIdToLike)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.happn.fr/api/users/my-user-id/accepted/my-user-id-to-like')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.like(userIdToLike)
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when liking with invalid user id', () => {
    const userId = undefined

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should reject with invalid arguments error', () => {
      return subject.like(userId)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when liking and not authorized', () => {
    const userId = 'my-user-id'
    const photoId = 'my-photo-id'
    const contentHash = 'my-content-hash'
    const sNumber = 'my-s-number'

    beforeEach(() => {
      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should reject with tinder not authorized error', (done) => {
      subject.like(userId, photoId, contentHash, sNumber)
        .catch((error) => {
          error.should.be.instanceOf(HappnNotAuthorizedError)

          done()
        })
    })
  })

  describe('when passing', () => {
    const userId = 'my-user-id'
    const userIdToPass = 'my-user-id-to-pass'
    const statusCode = 200
    const body = { likes_remaining: 100 }
    const response = { statusCode, body }
    const accessToken = 'my-access-token'

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
      subject.accessToken = accessToken
      subject.userId = userId
    })

    it('should do a post request to https://api.happn.fr/api/users/my-user-id/rejected/my-user-id-to-pass', () => {
      return subject.pass(userIdToPass)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.happn.fr/api/users/my-user-id/rejected/my-user-id-to-pass')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.pass(userIdToPass)
        .then((_data) => {
          _data.should.be.equal(body)
        })
    })
  })

  describe('when passing with invalid user id', () => {
    const userId = undefined

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.replace('request', request)

      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should reject with invalid arguments error', () => {
      return subject.pass(userId)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when passing and not authorized', () => {
    const userId = 'my-user-id'

    beforeEach(() => {
      const HappnWrapper = require('../src/happn-wrapper')
      subject = new HappnWrapper()
    })

    it('should reject with tinder not authorized error', (done) => {
      subject.pass(userId)
        .catch((error) => {
          error.should.be.instanceOf(HappnNotAuthorizedError)

          done()
        })
    })
  })
})
