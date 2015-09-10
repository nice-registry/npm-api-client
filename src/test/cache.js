/* globals afterEach, beforeEach, describe, it */

'use strict'

const expect         = require('code').expect
const nock           = require('nock')
const sinon          = require('sinon')
const fingerprint    = require('request-object-fingerprint')
var npm

describe('caching', function(){

  beforeEach(function(){
    process.env.ACL_CLIENT_REDIS_URL = 'redis://localhost:6379'
    npm = require('..')()
  })

  afterEach(function(){
    delete process.env.ACL_CLIENT_REDIS_URL
  })

  it('caches GETs if ACL_CLIENT_REDIS_URL is set and `ttl` option is present', function(done) {
    sinon.spy(npm.packages.get.cache, 'get')
    var mock = mockPackage('browserify')

    npm.packages.get('browserify', {ttl: 2, logger: null})
      .then(function(pkg){
        mock.done()
        expect(npm.packages.get.cache.get.called).to.equal(true)
        npm.packages.get.cache.get.restore()
        return npm.packages.get('browserify', {ttl: 2, logger: null})
      })
      .then(function(pkg){
        expect(pkg).to.be.an.object()
        done()
      })
  })

  it('allows human-friendly ttl strings', function(done){
    sinon.spy(npm.packages.get.cache, 'setex')
    var mock = mockPackage('mocha')

    var requestObj = {
      method: 'GET',
      json: true,
      url: 'https://api.npmjs.com/package/mocha'
    }

    var finger = fingerprint(requestObj)

    npm.packages.get('mocha', {ttl: '3 seconds', logger: null})
      .then(function(pkg){
        mock.done()
        expect(npm.packages.get.cache.setex.calledWith(finger, 3)).to.equal(true)
        npm.packages.get.cache.setex.restore()
        done()
      })
  })

  it('does not cache GETs if `ttl` option is absent', function(done){
    sinon.spy(npm.packages.get.cache, 'get')
    sinon.spy(npm.packages.get.cache, 'setex')
    var mock = mockPackage('cheerio')

    npm.packages.get('cheerio', {logger: null})
      .then(function(pkg){
        mock.done()
        expect(npm.packages.get.cache.get.called).to.equal(false)
        expect(npm.packages.get.cache.setex.called).to.equal(false)
        npm.packages.get.cache.get.restore()
        npm.packages.get.cache.setex.restore()
        done()
      })
  })

  it('does not cache PUTs', function(done){
    var pkg = {
      name: 'novelty'
    }

    sinon.spy(npm.packages.get.cache, 'get')
    sinon.spy(npm.packages.get.cache, 'setex')
    var mock = nock('https://api.npmjs.com')
        .put('/package', pkg)
        .once()
        .reply(200, pkg)

    npm.packages.create(pkg, {logger: null})
      .then(function(p){
        mock.done()
        expect(npm.packages.get.cache.get.called).to.equal(false)
        expect(npm.packages.get.cache.setex.called).to.equal(false)
        npm.packages.get.cache.get.restore()
        npm.packages.get.cache.setex.restore()
        done()
      })
  })

  it('is invalidated by calling `cache.drop` with the same arguments', function(done) {
    sinon.spy(npm.packages.get.cache, 'get')
    sinon.spy(npm.packages.get.cache, 'del')
    var mock = mockPackage('lodash')
    var mock2 = mockPackage('lodash')

    npm.packages.get('lodash', {ttl: 3, logger: null})
      .then(function(pkg){
        mock.done()
        expect(npm.packages.get.cache.get.called).to.equal(true)
        npm.packages.get.cache.get.restore()
        return npm.packages.get.cache.drop('browserify')
      })
      .then(function(){
        expect(npm.packages.get.cache.del.called).to.equal(true)
        npm.packages.get.cache.del.restore()
        return npm.packages.get('lodash', {logger: null})
      })
      .then(function(){
        mock2.done()
        done()
      })
  })

})

function mockPackage(name){
  return nock('https://api.npmjs.com')
    .get('/package/'+name)
    .once()
    .reply(200, {
      name: name,
      description: name + ' is a cool package'
    })
}
