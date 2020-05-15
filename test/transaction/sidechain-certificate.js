"use strict";

var should = require("chai").should();
var SidechainCerficate = require("../../lib/transaction/sidechaincerficate");
var SidechainCerficateOutput = require("../../lib/transaction/sidechaincertificateoutput");
var assert = require('chai').assert;
var expect = require('chai').expect;
var fs = require('fs');
var testdataInput = require('../data_tx/tx-sidechain-certificate.js');
var testdataExpected =  fs.readFileSync('test/data_tx/tx-sidechain-certificate.json').toString();
var Networks = require('../../lib/networks');
var index = 0;

describe('#Sidechain certificate', function() {

  describe('Certificate parsing', function() {
    var sccer = SidechainCerficate.fromString(testdataInput.blockhex);
    var sccerExpected = JSON.parse(testdataExpected);


    it('parses the sidechainId correctly', function() {
      assert.equal(sccer.sidechainId, sccerExpected.cert.scid);
    });
    it('parses the epochNumber correctly', function() {
      assert.equal(sccer.epochNumber, sccerExpected.cert.epochNumber);
    });
    it('parses the endEpochBlockHash correctly', function() {
      assert.equal(sccer.endEpochBlockHash, sccerExpected.cert.endEpochBlockHash);
    }); 
    it('parses the version correctly', function() {
      assert.equal(sccer.version, sccerExpected.version);
    }); 
    it('parses the totalAmount correctly', function() {
      assert.equal(sccer.totalAmount, sccerExpected.cert.totalAmount);
    }); 
    it('parses the fee correctly', function() {
      assert.equal(sccer.fee, sccerExpected.cert.fee);
    }); 
    it('parses the nonce correctly', function() {
      assert.equal(sccer.nonce, sccerExpected.cert.nonce);
    }); 
    it('parses the output correctly', function() {
      assert.equal(sccer.outputs.length, 1);
      var output1 = sccer.outputs[0];
      assert.equal(output1.pubKeyHash, sccerExpected.vout[0].pubkeyhash);
      assert.equal(output1.satoshis, sccerExpected.vout[0].valueZat);
      assert.equal(output1.getAddress(Networks.regtest), sccerExpected.vout[0].scriptPubKey.addresses[0]);
    }); 
    it('output to object', function() {
      var output1 = sccer.outputs[0];
      var obj = output1.toObject();
      assert.equal(obj.pubKeyHash, sccerExpected.vout[0].pubkeyhash);
      assert.equal(obj.satoshis, sccerExpected.vout[0].valueZat);
    }); 
    it('output from object', function() {
      var output1 = sccer.outputs[0];
      var obj = output1.toObject();

      var obj2 = new SidechainCerficateOutput(obj);
      assert.equal(obj2.pubKeyHash, sccerExpected.vout[0].pubkeyhash);
      assert.equal(obj2.satoshis, sccerExpected.vout[0].valueZat);
    }); 
    it('output to raw and from raw', function() {
      var output1 = sccer.outputs[0];
      var buf = output1.toBufferWriter();
      var bufHex = buf.toBuffer().toString('hex');

  
      var obj2 = SidechainCerficateOutput.fromString(bufHex);
      assert.equal(obj2.pubKeyHash, sccerExpected.vout[0].pubkeyhash);
      assert.equal(obj2.satoshis, sccerExpected.vout[0].valueZat);
    });

    it('certificate to raw', function() {
      var buf = sccer.toBufferWriter();
      var bufHex = buf.toBuffer().toString('hex');
      assert.equal(bufHex, testdataInput.blockhex);
    });

    it('certificate id (hash) is generated correclty', function() {
      assert.equal(sccer.id, sccerExpected.certid);
      assert.equal(sccer.hash, sccerExpected.certid); 
    });

  }); 


});