'use strict';

var bitcore = require('../..');
var Block = bitcore.Block;
var chai = require('chai');
var fs = require('fs');
var should = chai.should();
var dataJson = fs.readFileSync('test/data/blksidechain.json').toString();
var data = require('../data/blksidechain');


describe('Block with sidechain certificate', function() {

  var blockhex = data.blockhex;
  var blockbuf = Buffer.from(blockhex, 'hex');
  var expectedData = JSON.parse(dataJson);


  it('should parse correct sidechain certificates', function() {
    var b = new Block(blockbuf);
    b.sidechainCertificates.length.should.equal(1);
    b.sidechainCertificates[0].id.should.equal(expectedData.cert[0])
  });
  

  it('should generate correct hex', function() {
    var b = new Block(blockbuf);
    b.toBuffer().toString('hex').should.equal(blockhex);    
  });
  

});