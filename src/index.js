const set           = require('lodash').set
const bole          = require('bole')
const redis         = require('redis-url')
const operate       = require('./operate')
const dropCache     = require('./drop-cache')
const operations    = require('./operations')

module.exports = function() {
  var npm = {}

  if (process.env.ACL_CLIENT_REDIS_URL) {
    npm._logger = bole('acl-client-redis')
    npm._redis = redis.connect(process.env.ACL_CLIENT_REDIS_URL)
    npm._redis.on('error', function (err) {
      npm._logger.error('cache redis connection lost; reconnecting')
      npm._logger.error(err)
    })
  }

  operations.forEach(function(operation){

    // Attach caching functions if redis is configured
    if (npm._redis) {
      operation.cache = npm._redis
      operation.cache.drop = dropCache.bind(operation)
    }

    // Bind the request function to the current operation
    set(npm, operation.name, operate.bind(operation))

    // Attach properties to the function object for reference
    set(npm, operation.name+"._name", operation.name)
    Object.keys(operation).forEach(function(key){
      set(npm, operation.name+"."+key, operation[key])
    })

  })

  return npm
}
