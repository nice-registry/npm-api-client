const url            = require('url')
const _              = require('lodash')
const isObject       = _.isObject
const isArguments    = _.isArguments
const extend         = _.extend
const all            = _.all
const merge          = _.merge
const get            = _.get
const last           = _.last
const isString       = _.isString
const isUrl          = require('is-url')
const bole           = require('bole')
const humanInterval  = require('human-interval')
const fingerprint    = require('request-object-fingerprint')
const allowedOptions = ['hapiRequest','logger','bearer','ttl']

module.exports = function distill(operation, args) {

  // TODO: ask @ceej and @rockbot about a good default logging
  // setup that is not too loud for tests but sufficiently loud
  // in regular use.
  //
  // var logger = bole('acl-client')
  // var logger = {
  //   debug: console.log,
  //   info: console.log,
  //   warn: console.log,
  //   error: console.error
  // }
  var logger = {
    debug: noop,
    info: noop,
    warn: noop,
    error: console.error
  }
  var options = {}

  if (isArguments) {
    args = Array.prototype.slice.call(args)
  }

  // Start assembling the request object
  var requestObj = {
    method: operation.method,
    json: true,
    headers: {}
  }

  // Start assembling the request URL
  var urlObj = {
    protocol: "https",
    host: process.env.ACL_CLIENT_HOST || "api.npmjs.com",
    pathname: operation.path,
  }

  // Infer protocol and host if given a full URL
  if (isUrl(process.env.ACL_CLIENT_HOST)) {
    var parts = url.parse(process.env.ACL_CLIENT_HOST)
    urlObj.protocol = parts.protocol
    urlObj.host = parts.host
  }

  // Allow schema to override host using name of an envionment variable
  if (operation.host && process.env[operation.host]) {
    var customHost = process.env[operation.host]
    if (isUrl(customHost)) {
      urlObj.protocol = url.parse(customHost).protocol
      urlObj.host = url.parse(customHost).host
    } else {
      urlObj.host = customHost
    }
  }

  // Treat last argument as an options object if
  // all of its keys are explicitly allowed
  if (
    args.length
    && isObject(last(args))
    && all(Object.keys(last(args)), function(key) { return allowedOptions.indexOf(key) > -1 })
  ) {
    options = args.pop()

    // Bearer token
    if (options.bearer) {
      requestObj.headers.bearer = options.bearer
    } else if (get(options, 'hapiRequest.auth.credentials.name')) {
      requestObj.headers.bearer = options.hapiRequest.auth.credentials.name
    }

    // Logger
    if (options.logger && validLogger(options.logger)) {
      logger = options.logger
    } else if (get(options, 'hapiRequest.logger') && validLogger(options.hapiRequest.logger)) {
      logger = options.hapiRequest.logger
    } else if ('logger' in options && !options.logger) {
      logger = {
        debug: noop,
        info: noop,
        warn: noop,
        error: noop
      }
    }
  }

  // If last argument is an object, turn it into the request body
  // for POSTs and PUTs, or the query string for GETs
  if (args.length && isObject(last(args))) {
    switch(operation.method){
      case "PUT":
      case "POST":
        requestObj.body = args.pop()
        break
      case "GET":
        urlObj.query = args.pop()
        break
    }
  }

  // Remove headers object if empty
  if (requestObj.headers && !Object.keys(requestObj.headers).length) {
    delete requestObj.headers
  }

  // Remove body object if empty
  if (requestObj.body && !Object.keys(requestObj.body).length) {
    delete requestObj.body
  }

  // Remaining arguments are considered positional,
  // and injected into the path template
  args.forEach(function(arg) {
    urlObj.pathname = urlObj.pathname.replace(/{\w+}/, arg)
  })

  // Throw an error if any path params are missing
  var missingArgs = (urlObj.pathname.match(/{(\w+)}/g) || [])
    .map(function(arg) { return arg.replace(/[{}]/g, '') })

  if (missingArgs.length) {
    throw Error(`call to ${operation.name} missing required arguments: ${missingArgs}`)
  }

  requestObj.url = url.format(urlObj)


  if (isString(options.ttl)) {
    options.ttl = humanInterval(options.ttl)/1000
  }

  return {
    requestObj: requestObj,
    ttl: options.ttl,
    logger: logger,
    fingerprint: fingerprint(requestObj)
  }
}

function noop() {
  // a silent logging function for tests
}

function validLogger(logger) {
  return Boolean(logger.debug && logger.info && logger.warn && logger.error)
}
