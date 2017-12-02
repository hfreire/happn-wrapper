/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

describe('Module', () => {
  let subject
  let HappnWrapper
  let HappnNotAuthorizedError

  before(() => {
    HappnWrapper = td.object()

    HappnNotAuthorizedError = td.object()
  })

  afterEach(() => td.reset())

  describe('when loading', () => {
    beforeEach(() => {
      td.replace('../src/happn-wrapper', HappnWrapper)

      td.replace('../src/errors', { HappnNotAuthorizedError })

      subject = require('../src/index')
    })

    it('should export happn wrapper', () => {
      subject.should.have.property('HappnWrapper', HappnWrapper)
    })

    it('should export happn not authorized error', () => {
      subject.should.have.property('HappnNotAuthorizedError', HappnNotAuthorizedError)
    })
  })
})
