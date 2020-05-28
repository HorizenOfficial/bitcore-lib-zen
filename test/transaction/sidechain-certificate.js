"use strict";

var Address = require("../../lib/address");
var Output = require("../../lib/transaction/output");
var Input = require("../../lib/transaction/input/input");
var Transaction = require("../../lib/transaction/transaction");
var assert = require('chai').assert;
var fs = require('fs');
var testdataInput = require('../data_tx/tx-sidechain-certificate.js');
var testdataExpected =  fs.readFileSync('test/data_tx/tx-sidechain-certificate.json').toString();
var Networks = require('../../lib/networks');
var BufferReader = require('../../lib/encoding/bufferreader');

describe('#Sidechain certificate', function() {

  describe('Certificate parsing', function() {
    var sccer = new Transaction(testdataInput.blockhex);
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

    describe('Certificate backwardTransfer output parsing', function() {
      var expectedVout = sccerExpected.vout.filter((ele) => { return ele[ "backward transfer"]});
      var parsedVout = sccer.outputs.filter((ele) =>  ele.isFromBackwardTransfer);

      it('parses the output correctly', function() {       
        assert.equal(parsedVout.length, expectedVout.length);
        if (parsedVout.length > 0){
          var output1 = parsedVout[0];
          assert.equal(output1.toObject().pubKeyHash, expectedVout[0].pubkeyhash);
          assert.equal(output1.satoshis, expectedVout[0].valueZat);
          var address = Address(output1._pubKeyHash, Networks.regtest).toString(true);
          assert.equal(address, expectedVout[0].scriptPubKey.addresses[0]);
        }
      });
      it('output to object', function() {
        if (parsedVout.length > 0){
          var output1 = parsedVout[0];
          var obj = output1.toObject();
          assert.equal(obj.pubKeyHash, expectedVout[0].pubkeyhash);
          assert.equal(obj.satoshis, expectedVout[0].valueZat);
        }
      }); 
      it('output  to raw and from raw', function() {
        if (parsedVout.length > 0){
          var output1 = parsedVout[0];
          var buf = output1.toBufferWriter();    
          var obj2 = Output.fromBufferReader(new BufferReader(buf.toBuffer()), true);
          assert.equal(obj2.toObject().pubKeyHash, expectedVout[0].pubkeyhash);
          assert.equal(obj2.satoshis, expectedVout[0].valueZat);
        }
      });  
    }); 

    describe('Certificate transaction output parsing', function() {
      it('parses the output correctly', function() {       
        assert.equal(sccer.outputs.length, sccerExpected.vout.length);
        if (sccerExpected.vout.length > 0){
          var output1 = sccer.outputs[0];
          assert.equal(output1.pubKeyHash, sccerExpected.vout[0].pubkeyhash);
          assert.equal(output1.satoshis, sccerExpected.vout[0].valueZat);
          if (output1.script.isPublicKeyHashReplayOut()){
            var address = Address(output1.script.getPublicKeyHash(), Networks.regtest).toString(true);
            assert.equal(address, sccerExpected.vout[0].scriptPubKey.addresses[0]);
          }
        }
      });
      it('output to object', function() {
        if (sccerExpected.vout.length > 0){
          var output1 = sccer.outputs[0];
          var obj = output1.toObject();
          assert.equal(obj.pubKeyHash, output1.pubKeyHash);
          assert.equal(obj.satoshis, sccerExpected.vout[0].valueZat);
        }
      }); 
      it('output from object', function() {
        if (sccerExpected.vout.length > 0){
          var output1 = sccer.outputs[0];
          var obj = output1.toObject();
          var obj2 = new Output(obj);
          assert.equal(obj2.pubKeyHash, sccerExpected.vout[0].pubkeyhash);
          assert.equal(obj2.satoshis, sccerExpected.vout[0].valueZat);
        }
      }); 
      it('output  to raw and from raw', function() {
        if (sccerExpected.vout.length > 0){
          var output1 = sccer.outputs[0];
          var buf = output1.toBufferWriter();
          var bRead = new BufferReader(buf.toBuffer());
          var obj2 = Output.fromBufferReader(bRead);
          assert.equal(obj2.pubKeyHash, sccerExpected.vout[0].pubkeyhash);
          assert.equal(obj2.satoshis, sccerExpected.vout[0].valueZat);
        }
      });  
    }); 


    describe('Certificate transaction input parsing', function() {
      it('parses the input correctly', function() {       
        assert.equal(sccer.inputs.length, sccerExpected.vin.length);
        if (sccer.inputs.length > 0){
          var input1 = sccer.inputs[0];
          assert.equal(input1.prevTxId.toString('hex'), sccerExpected.vin[0].txid);
          assert.equal(input1.sequenceNumber, sccerExpected.vin[0].sequence);
        }
      });
      it('output to object', function() {
        if (sccer.inputs.length > 0){
          var input1 = sccer.inputs[0];
          var obj = input1.toObject();
          assert.equal(obj.prevTxId, input1.prevTxId.toString('hex'));
          assert.equal(obj.sequenceNumber, input1.sequenceNumber);
        }
      }); 
      it('output from object', function() {
        if (sccer.inputs.length > 0){
          var input1 = sccer.inputs[0];
          var obj = input1.toObject();
          var obj2 = new Input(obj);
          assert.equal(obj2.prevTxId.toString('hex'), input1.prevTxId.toString('hex'));
          assert.equal(obj2.sequenceNumber, input1.sequenceNumber);
        }
      });         
    }); 

    it('certificate to raw', function() {
      var buf = sccer.toBuffer();
      var bufHex = buf.toString('hex');
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