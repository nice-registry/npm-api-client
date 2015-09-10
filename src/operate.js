const distill        = require('./distill')
const http           = require('request')

module.exports = function operate() {
  var _this = this
  const distilled = distill(this, arguments)
  const requestObj = distilled.requestObj
  const ttl = distilled.ttl
  const logger = distilled.logger
  const fingerprint = distilled.fingerprint

  logger.info('acl-client request: ' + _this.name)
  logger.info(distilled.requestObj)

  return new Promise(function(resolve, reject) {

    if (_this.cache && ttl && requestObj.method === "GET") {

      _this.cache.get(fingerprint, function(err, value) {

        if (err) {
          logger.error(`problem getting ${fingerprint} from redis @ ${_this.cache}`)
          logger.error(err)
        } else if (value){
          value = safeparse(value)
        }

        if (value) {
          logger.info(`found ${fingerprint} in cache`)
          return resolve(value)
        }

        logger.info(`get: ${requestObj.url}`)

        http(requestObj, function(err, response, data) {

          if (err) {
            logger.error(err)
            return reject(err)
          }

          if (response.statusCode !== 200) {
            var e = new Error(`unexpected status code ${response.statusCode}`)
            e.statusCode = response.statusCode
            return reject(err)
          }

          logger.info(`caching ${fingerprint} for ${ttl} seconds`)

          _this.cache.setex(fingerprint, ttl, JSON.stringify(data), function(err, unused){
            if (err) {
              logger.error(`unable to cache ${fingerprint} in redis @ ${_this.cache}`)
              logger.error(err)
            } else {
              logger.info(`cached ${fingerprint}`)
            }
          })

          return resolve(data)
        })
      })
    } else {
      // make a non-cached request
      logger.info('non-cached request')

      http(requestObj, function(err, resp, body) {
        if (err) {
          logger.error(err)
          return reject(err)
        }

        if (resp.statusCode > 399 && resp.statusCode !== 404) {
          err = Error(`Error ${resp.statusCode}: ${body}`)
          err.statusCode = resp.statusCode
          logger.error(err)
          return reject(err)
        }

        return resolve(body)
      })
    }

  })

}

function safeparse(input) {
  try {
    return JSON.parse(input)
  } catch (ex) {
    return null
  }
}
