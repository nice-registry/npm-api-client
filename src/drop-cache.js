const distill        = require('./distill')

module.exports = function dropCache() {
  var _this = this
  const distilled = distill(this, arguments)
  const requestObj = distilled.requestObj
  const ttl = distilled.ttl
  const logger = distilled.logger
  const fingerprint = distilled.fingerprint

  logger.info('acl-client dropCache: ' + _this.name)
  logger.info(distilled.requestObj)

  return new Promise(function(resolve, reject) {
    _this.cache.del(fingerprint, function(err) {
      if (err) {
        logger.error(`problem dropping ${fingerprint} from redis @ ${_this.cache}`)
        logger.error(err)
        return reject(err)
      }
      return resolve()
    })
  })
}
