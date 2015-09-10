const shell      = require('shelljs')
const fs         = require('fs')
const yaml       = require('js-yaml')
const clone      = require('lodash').cloneDeep
const babel      = require("babel")
const Handlebars = require('handlebars')

shell.rm('-rf', 'dist')
shell.mkdir('-p', 'dist/test')

// src/operations.yml -> dist/operations.json
// -------------------------------------------------------------------------

var operations = yaml.safeLoad(fs.readFileSync(__dirname + '/operations.yml', 'utf8'))
  .map(function(operation){

    // GET is the default method
    if (!operation.method) operation.method = "GET"

    // Capitalize method
    operation.method = operation.method.toUpperCase()

    // Derive positional args from path
    operation.requiredArgs = (operation.path.match(/{(\w+)}/g) || [])
      .map(function(arg) {
        return arg.replace(/[{}]/g, '')
      })

    // Derive method signature
    var args = clone(operation.requiredArgs)
    switch (operation.method) {
      case "PUT":
      case "POST":
        args.push("body")
        break
      case "GET":
        args.push("[query]")
        break
      default:
        break
    }
    args.push("[options]")
    operation.signature = `${operation.name}(${args.join(", ")})`

    return operation
  })

fs.writeFileSync(__dirname + "/../dist/operations.json", JSON.stringify(operations, null, 2))

// babelify src scipts
// -------------------------------------------------------------------------

const scripts = [
  "index",
  "operate",
  "distill",
  "drop-cache",
  "test/cache",
  "test/index",
  "test/operations",
]

scripts.forEach(function(script){
  fs.writeFileSync(
    __dirname + `/../dist/${script}.js`,
    babel.transformFileSync(__dirname + `/${script}.js`).code
  )
})

// docs
// -------------------------------------------------------------------------

const readmeTemplate = Handlebars.compile(fs.readFileSync(__dirname + "/readme.hbs", "utf8"));

fs.writeFileSync(
  __dirname + "/../README.md",
  readmeTemplate({
    operations: operations,
    package: require("../package.json")
  })
)
