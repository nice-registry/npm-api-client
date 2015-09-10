/* globals afterEach, beforeEach, describe, it */

'use strict'

const npm      = require('..')()
const expect   = require('code').expect
const nock     = require('nock')
const sinon    = require('sinon')
var fixtures = {
  collaborator: {name: 'zeke', permissions: 'write'},
  hapiRequests: {
    bob: {
      server: true,
      auth: {credentials: {name: 'bob'}},
      logger: {
        debug: function() { /*no-op* */},
        info: function() { /*no-op* */},
        warn: function() { /*no-op* */},
        error: function() { /*no-op* */}
      }
    }
  }
}

describe('npm', function () {

  it('is an object', function(){
    expect(npm).to.be.an.object()
  })

  it('has a property for each resource', function(){
    expect(npm.packages).to.be.an.object()
    expect(npm.collaborators).to.be.an.object()
    expect(npm.teams).to.be.an.object()
    expect(npm.users).to.be.an.object()
    expect(npm.orgs).to.be.an.object()
    expect(npm.customers).to.be.an.object()
  })

})

describe('npm.packages', function () {

  it('has a bunch of functions as properties', function(){
    expect(npm.packages.get).to.be.a.function()
    expect(npm.packages.list).to.be.a.function()
    expect(npm.packages.count).to.be.a.function()
    expect(npm.packages.star).to.be.a.function()
    expect(npm.packages.perms).to.be.a.function()
    expect(npm.packages.delete).to.be.a.function()
    expect(npm.packages.create).to.be.a.function()
    expect(npm.packages.getDefaultTeam).to.be.a.function()
  })

})

describe('npm.packages.get()', function () {

  it('makes an http request', function(done){
    var mock = nock('https://api.npmjs.com')
      .get('/package/browserify')
      .reply(200)
    npm.packages.get('browserify', {logger: null}).then(function(pkg){
      mock.done()
      done()
    })
  })

  it('throws an error if name argument is missing', function(){
    var throws = function () {
      npm.packages.get({logger: null})
    }
    expect(throws).to.throw('call to packages.get missing required arguments: packageName');
  })

  it('turns an options object into query params', function(done){
    var mock = nock('https://api.npmjs.com')
      .get('/package/browserify?volume=11&alpha=delta')
      .reply(200)
    npm.packages.get('browserify', {volume: 11, alpha: 'delta'}, {logger: null}).then(function(pkg){
      mock.done()
      done()
    })
  })

})

describe('npm.collaborators.add()', function(){

  it('uses object as request body', function(done){
    var mock = nock('https://api.npmjs.com')
      .put('/package/browserify/collaborators', fixtures.collaborator)
      .reply(200, fixtures.collaborator)

    npm.collaborators.add('browserify', fixtures.collaborator, {logger: null}).then(function(collaborator){
      mock.done()
      done()
    })
  })

})

describe('bearer token', function(){

  it('extracts bearer token from last argument if it is a hapi request object', function(done) {
    var mock = nock('https://api.npmjs.com', {reqheaders: {'bearer': 'bob'}})
      .put('/package/browserify/collaborators', fixtures.collaborator)
      .reply(200, fixtures.collaborator)

    npm.collaborators.add('browserify', fixtures.collaborator, {hapiRequest: fixtures.hapiRequests.bob})
      .then(function(collaborator){
        mock.done()
        done()
      })
  })

  it('extracts bearer token from options in GET requests', function(done) {
    var mock = nock('https://api.npmjs.com', {reqheaders: {'bearer': 'substack'}})
      .get('/package/browserify/collaborators')
      .reply(200)

    npm.collaborators.list('browserify', {bearer: 'substack', logger: null})
      .then(function(pkg){
        mock.done()
        done()
      })
  })

  it('extracts bearer token from options in PUT requests', function(done) {
    var mock = nock('https://api.npmjs.com', {reqheaders: {bearer: 'sue'}})
      .put('/package/browserify/collaborators', fixtures.collaborator)
      .reply(200, fixtures.collaborator)

    npm.collaborators.add('browserify', fixtures.collaborator, {bearer: 'sue', logger: null})
      .then(function(collaborator){
        mock.done()
        done()
      })
  })
})

describe('alternate hosts', function() {

  it('infers customer hostname from process.env.ACL_CLIENT_CUSTOMER_HOST', function(done) {
    process.env.ACL_CLIENT_CUSTOMER_HOST = 'customer.com'
    var npm = require('..')()
    var mock = nock('https://customer.com')
      .get('/stripe/bob')
      .reply(200)
    npm.customers.get('bob', {logger: null}).then(function(pkg){
      mock.done()
      delete process.env.ACL_CLIENT_CUSTOMER_HOST
      done()
    })
  })

  describe('extraction of hostname from full URLs', function() {

    it('ACL_CLIENT_HOST', function(done) {
      process.env.ACL_CLIENT_HOST = 'http://acl-host.com:1234'
      var npm = require('..')()
      var mock = nock('http://acl-host.com:1234')
        .get('/package/lodash')
        .reply(200)
      npm.packages.get('lodash', {logger: null}).then(function(pkg){
        mock.done()
        delete process.env.ACL_CLIENT_HOST
        done()
      })
    })

    it('ACL_CLIENT_CUSTOMER_HOST', function(done) {
      process.env.ACL_CLIENT_CUSTOMER_HOST = 'http://customer.com/123'
      const npm2 = require('..')()
      var mock = nock('http://customer.com')
        .get('/stripe/bob')
        .reply(200)
      npm2.customers.get('bob', {logger: null}).then(function(pkg){
        mock.done()
        delete process.env.ACL_CLIENT_CUSTOMER_HOST
        done()
      })
    })

  })


})

describe('failure', function(){

  it('rejects if statusCode is 402', function(done) {
    var mock = nock('https://api.npmjs.com')
      .get('/user/nobody')
      .reply(402)

    npm.users.get('nobody', {logger: null})
      .catch(function(err){
        expect(err.statusCode).to.equal(402)
        mock.done()
        done()
      })
  })

})

describe('logging', function() {

  it('logs successful requests to logger.info', function(done) {
    sinon.spy(fixtures.hapiRequests.bob.logger, 'info');

    var mock = nock('https://api.npmjs.com')
      .get('/package/browserify')
      .reply(200)

    var expectedRequestObj = {
      method: 'GET',
      json: true,
      headers: {
        bearer: 'bob'
      },
      url: 'https://api.npmjs.com/package/browserify'
    }

    npm.packages.get('browserify', {hapiRequest: fixtures.hapiRequests.bob}).then(function(pkg){
      mock.done()

      expect(fixtures.hapiRequests.bob.logger.info
        .calledWith('acl-client request: packages.get')).to.equal(true)

      expect(fixtures.hapiRequests.bob.logger.info
        .calledWith(expectedRequestObj)).to.equal(true)

      fixtures.hapiRequests.bob.logger.info.restore()
      done()
    })

  })

  it('logs 500-level failures to logger.error', function(done) {
    sinon.spy(fixtures.hapiRequests.bob.logger, 'error');

    var mock = nock('https://api.npmjs.com')
      .get('/package/nonexistent')
      .reply(500, "mysterious error")

    var error = Error('mysterious')
    error.statusCode = 500

    npm.packages.get('nonexistent', {hapiRequest: fixtures.hapiRequests.bob})
    .catch(function(err){

      mock.done()
      expect(fixtures.hapiRequests.bob.logger.error
        .calledWith(error)).to.equal(true)

      fixtures.hapiRequests.bob.logger.error.restore()
      done()
    })

  })

  it('logs 400-level responses (other than 404s) as failures to logger.error', function(done) {
    sinon.spy(fixtures.hapiRequests.bob.logger, 'error');

    var mock = nock('https://api.npmjs.com')
      .get('/package/nonexistent')
      .reply(402, "payment required")

    var error = Error('Error 402: payment required')
    error.statusCode = 402

    npm.packages.get('nonexistent', {hapiRequest: fixtures.hapiRequests.bob})
    .catch(function(err){

      mock.done()
      expect(fixtures.hapiRequests.bob.logger.error
        .calledWith(error)).to.equal(true)

      fixtures.hapiRequests.bob.logger.error.restore()
      done()
    })

  })

})
