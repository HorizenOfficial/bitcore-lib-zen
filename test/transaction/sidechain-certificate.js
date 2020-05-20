"use strict";

var should = require("chai").should();
var Address = require("../../lib/address");
var Output = require("../../lib/transaction/output");
var Input = require("../../lib/transaction/input/input");
var SidechainCerficate = require("../../lib/transaction/sidechaincerficate");
var SidechainCerficateOutput = require("../../lib/transaction/sidechaincertificateoutput");
var assert = require('chai').assert;
var expect = require('chai').expect;
var fs = require('fs');
var testdataInput = require('../data_tx/tx-sidechain-certificate.js');
var testdataExpected =  fs.readFileSync('test/data_tx/tx-sidechain-certificate.json').toString();
var Networks = require('../../lib/networks');
var index = 0;
var BufferReader = require('../../lib/encoding/bufferreader');

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
    it('parses the getValueOfBackwardTransfers correctly', function() {
      var expectedVout = sccerExpected.vout.filter((ele) => { return ele[ "backward transfer"]});
      var expectedAmount = 0;
      expectedVout.forEach(function(output) {
        expectedAmount = expectedAmount +output.valueZat;
      });
       assert.equal(sccer.getValueOfBackwardTransfers(), expectedAmount);
    }); 
    it('parses the getValueOfChange correctly', function() {
      var expectedVout = sccerExpected.vout.filter((ele) => { return !ele[ "backward transfer"]});
      var expectedAmount = 0;
      expectedVout.forEach(function(output) {
        expectedAmount = expectedAmount +output.valueZat;
      });
      assert.equal(sccer.getValueOfChange(), expectedAmount);

    }); 

    describe('Certificate backwardTransfer output parsing', function() {
      var expectedVout = sccerExpected.vout.filter((ele) => { return ele[ "backward transfer"]});

      it('parses the output correctly', function() {       
        assert.equal(sccer.backwardTransferOutputs.length, expectedVout.length);
        if (expectedVout.length > 0){
          var output1 = sccer.backwardTransferOutputs[0];
          assert.equal(output1.pubKeyHash, expectedVout[0].pubkeyhash);
          assert.equal(output1.satoshis, expectedVout[0].valueZat);
          assert.equal(output1.getAddress(Networks.regtest), expectedVout[0].scriptPubKey.addresses[0]);
        }
      });
      it('output to object', function() {
        if (expectedVout.length > 0){
          var output1 = sccer.backwardTransferOutputs[0];
          var obj = output1.toObject();
          assert.equal(obj.pubKeyHash, output1.pubKeyHash);
          assert.equal(obj.satoshis, expectedVout[0].valueZat);
        }
      }); 
      it('output from object', function() {
        if (expectedVout.length > 0){
          var output1 = sccer.backwardTransferOutputs[0];
          var obj = output1.toObject();
          var obj2 = new SidechainCerficateOutput(obj);
          assert.equal(obj2.pubKeyHash, expectedVout[0].pubkeyhash);
          assert.equal(obj2.satoshis, expectedVout[0].valueZat);
        }
      }); 
      it('output  to raw and from raw', function() {
        if (expectedVout.length > 0){
          var output1 = sccer.backwardTransferOutputs[0];
          var buf = output1.toBufferWriter();
          var bufHex = buf.toBuffer().toString('hex'); 
      
          var obj2 = SidechainCerficateOutput.fromString(bufHex);
          assert.equal(obj2.pubKeyHash, expectedVout[0].pubkeyhash);
          assert.equal(obj2.satoshis, expectedVout[0].valueZat);
        }
      });  
    }); 

    describe('Certificate transaction output parsing', function() {
      var expectedVout = sccerExpected.vout.filter((ele) => { return !ele[ "backward transfer"]});
      it('parses the output correctly', function() {       
        assert.equal(sccer.transactionOutputs.length, expectedVout.length);
        if (expectedVout.length > 0){
          var output1 = sccer.transactionOutputs[0];
          assert.equal(output1.pubKeyHash, expectedVout[0].pubkeyhash);
          assert.equal(output1.satoshis, expectedVout[0].valueZat);
          if (output1.script.isPublicKeyHashReplayOut()){
            var address = Address(output1.script.getPublicKeyHash(), Networks.regtest).toString(true);
            assert.equal(address, expectedVout[0].scriptPubKey.addresses[0]);
          }
        }
      });
      it('output to object', function() {
        if (expectedVout.length > 0){
          var output1 = sccer.transactionOutputs[0];
          var obj = output1.toObject();
          assert.equal(obj.pubKeyHash, output1.pubKeyHash);
          assert.equal(obj.satoshis, expectedVout[0].valueZat);
        }
      }); 
      it('output from object', function() {
        if (expectedVout.length > 0){
          var output1 = sccer.transactionOutputs[0];
          var obj = output1.toObject();
          var obj2 = new Output(obj);
          assert.equal(obj2.pubKeyHash, expectedVout[0].pubkeyhash);
          assert.equal(obj2.satoshis, expectedVout[0].valueZat);
        }
      }); 
      it('output  to raw and from raw', function() {
        if (expectedVout.length > 0){
          var output1 = sccer.transactionOutputs[0];
          var buf = output1.toBufferWriter();
          var bRead = new BufferReader(buf.toBuffer());
          var obj2 = Output.fromBufferReader(bRead);
          assert.equal(obj2.pubKeyHash, expectedVout[0].pubkeyhash);
          assert.equal(obj2.satoshis, expectedVout[0].valueZat);
        }
      });  
    }); 


    describe('Certificate transaction input parsing', function() {
      it('parses the input correctly', function() {       
        assert.equal(sccer.transactionInputs.length, sccerExpected.vin.length);
        if (sccer.transactionInputs.length > 0){
          var input1 = sccer.transactionInputs[0];
          assert.equal(input1.prevTxId.toString('hex'), sccerExpected.vin[0].txid);
          assert.equal(input1.sequenceNumber, sccerExpected.vin[0].sequence);
        }
      });
      it('output to object', function() {
        if (sccer.transactionInputs.length > 0){
          var input1 = sccer.transactionInputs[0];
          var obj = input1.toObject();
          assert.equal(obj.prevTxId, input1.prevTxId.toString('hex'));
          assert.equal(obj.sequenceNumber, input1.sequenceNumber);
        }
      }); 
      it('output from object', function() {
        if (sccer.transactionInputs.length > 0){
          var input1 = sccer.transactionInputs[0];
          var obj = input1.toObject();
          var obj2 = new Input(obj);
          assert.equal(obj2.prevTxId.toString('hex'), input1.prevTxId.toString('hex'));
          assert.equal(obj2.sequenceNumber, input1.sequenceNumber);
        }
      });         
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
 
    it('test certificate outputs property', function() {
      assert.equal(sccer.outputs.length, sccerExpected.vout.length);
    });   

  }); 


});