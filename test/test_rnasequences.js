/*
 * biojs-vis-rnasequences
 * https://github.com/dianapapyan/biojs-vis-rnasequences
 *
 * Copyright (c) 2014 Diana
 * Licensed under the Apache 2 license.
 */

// chai is an assertion library
var chai = require('chai');

// @see http://chaijs.com/api/assert/
var assert = chai.assert;

// register alternative styles
// @see http://chaijs.com/api/bdd/
chai.expect();
chai.should();

// requires your main app (specified in index.js)
var rnasequences = require('../');

describe('biojs-vis-rnasequences module', function(){
  describe('#hello()', function(){
    it('should return a hello', function(){

      assert.equal(rnasequences.hello('biojs'), ("hello biojs"));
      
      // alternative styles
      rnasequences.hello('biojs').should.equal("hello biojs");
    });
  });
});
