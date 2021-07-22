"use strict";

var Transaction = require("../../lib/transaction/transaction");
var assert = require('chai').assert;
var testdataExpected =  require('../data_tx/tx-sidechain-certificate.json')
var BufferUtil = require('../../lib/util/buffer');

describe('#Sidechain certificate', function() {

  describe('Certificate parsing', function() {
    var index = 0;
    testdataExpected.forEach(function (ele) {
      it('vector #' + index+": "+ele.description, function() {
        var hexa = ele.hex;
        var cert=Transaction(hexa);
        var certJson = ele.json;

        //certid
        assert.equal(cert.hash, certJson.certid);
        //version
        assert.equal(cert.version, certJson.version);
        //vin
        assert.equal(cert.inputs.length,certJson.vin.length);
        for (var i=0; i<certJson.vin.length;i++) {
          assert.equal(cert.inputs[i].toObject().prevTxId,certJson.vin[i].txid);
          assert.equal(cert.inputs[i].toObject().sequenceNumber,certJson.vin[i].sequence);
          assert.equal(cert.inputs[i].toObject().outputIndex,certJson.vin[i].vout);
        }

        //scid
        assert.equal(cert.sidechainId, certJson.cert.scid);
        //epoch number
        assert.equal(cert.epochNumber, certJson.cert.epochNumber);
        //quality
        assert.equal(cert.quality, certJson.cert.quality);
        //endEpochCumScTxCommTreeRoot
        assert.equal(cert.endEpochCumScTxCommTreeRoot.toString('hex'), certJson.cert.endEpochCumScTxCommTreeRoot);
        //scProof
        assert.equal(cert.scProof, certJson.cert.scProof);
        //vFieldElementCertificateField
        assert.deepEqual(cert.vFieldElementCertificateField,certJson.cert.vFieldElementCertificateField);
        //vBitVectorCertificateField
        assert.deepEqual(cert.vBitVectorCertificateField,certJson.cert.vBitVectorCertificateField);
        //ftScFee
        assert.equal(cert.ftScFee / 1e8, certJson.cert.ftScFee);
        //mbtrScFee
        assert.equal(cert.mbtrScFee / 1e8, certJson.cert.mbtrScFee);

        //vout
        assert.equal(cert.outputs.length,certJson.vout.length);
        for (var i=0; i<certJson.vout.length;i++) {
          assert.equal(cert.outputs[i].toObject().satoshis,certJson.vout[i].valueZat);
          assert.equal(cert.outputs[i].toObject().script,certJson.vout[i].scriptPubKey.hex);
          if (cert.outputs[i].toObject().isFromBackwardTransfer && cert.outputs[i].toObject().isFromBackwardTransfer == true) {
            assert.equal(cert.outputs[i].toObject().isFromBackwardTransfer,certJson.vout[i]["backward transfer"]);
            assert.equal(BufferUtil.reverse(Buffer.from(cert.outputs[i].toObject().pubKeyHash, 'hex')).toString('hex'),certJson.vout[i].pubkeyhash);
          }
        }

        //serialize
        assert.equal(cert.toBuffer().toString('hex'),hexa);

        //create certificate from existing certificate
        var new_Cert =  Transaction(cert.toObject());
        assert.equal(new_Cert.toBuffer().toString('hex'),cert.toBuffer().toString('hex'));
      });
      index++;
    });


  });


});
