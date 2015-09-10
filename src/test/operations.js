/* globals describe, it */

'use strict'

const operations = require('../operations')
const expect = require('code').expect

describe('operations schema', function () {

  it('is a non-empty array', function(){
    expect(operations).to.be.an.array()
    expect(operations.length).to.be.above(0)
  })

  describe('all operations', function() {
    it('have a name', function(){
      operations.forEach(function(operation){
        expect(operation.name).to.be.a.string()
        expect(operation.name.length).to.be.above(1)
      })
    })

    it('have an uppercase method', function(){
      operations.forEach(function(operation){
        expect(operation.method).to.be.a.string()
        expect(operation.method.length).to.be.above(0)
        expect(operation.method).to.equal(operation.method.toUpperCase())
      })
    })

    it('have a derived method signature', function(){
      operations.forEach(function(operation){
        expect(operation.signature).to.be.a.string()
        expect(operation.signature.length).to.be.above(0)
      })
    })

    it('has derived positional args', function(){
      operations.forEach(function(operation){
        expect(operation.requiredArgs).to.be.an.array()
      })
    })

  })

})
