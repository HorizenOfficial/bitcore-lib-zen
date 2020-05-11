"use strict";

var should = require("chai").should();
var Transaction = require ("../../lib/transaction");
var assert = require('chai').assert;
var expect = require('chai').expect;
var txes = require('../data_tx/tx.json');
var index = 0;

describe('#Sidechain creation', function() {

  describe('SC_create', function() {
    var index = 0;
    txes.forEach(function(vector) {

      it('vector #' + index, function() {
        if (vector.length > 1) {
          var hexa = vector[0];
          var tx=Transaction(hexa);
          var txJson = JSON.parse(vector[1]);
          //version
          assert.equal(tx.version,txJson.version);

          //txid
          assert.equal(tx.hash,txJson.txid);

          //locktime
          assert.equal(tx.nLockTime,txJson.locktime);

          //vin
          assert.equal(tx.inputs.length,txJson.vin.length);
          for (var i=0; i<txJson.vin.length;i++) {
            assert.equal(tx.inputs[i].toObject().prevTxId,txJson.vin[i].txid);
            assert.equal(tx.inputs[i].toObject().sequenceNumber,txJson.vin[i].sequence);
            assert.equal(tx.inputs[i].toObject().outputIndex,txJson.vin[i].vout);
          }

          //vout
          assert.equal(tx.outputs.length,txJson.vout.length);
          for (var i=0; i<txJson.vout.length;i++) {
            assert.equal(tx.outputs[i].toObject().satoshis,txJson.vout[i].valueZat);
          }

          //Sidechain
          var sc = {
            vsc_ccout : tx.sc_params.toObject().vsc_ccout,
            vcl_ccout : tx.sc_params.toObject().vcl_ccout,
            vft_ccout : tx.sc_params.toObject().vft_ccout
          }

          //vsc_ccout
          assert.equal(sc.vsc_ccout.length,txJson.vsc_ccout.length);
          for (var i=0; i<txJson.vsc_ccout.length;i++) {
            assert.equal(sc.vsc_ccout[i].scid,txJson.vsc_ccout[i].scid);
            assert.equal(sc.vsc_ccout[i].epoch_length,txJson.vsc_ccout[i]["withdrawal epoch length"]);
          }

          //vcl_ccout
          assert.equal(sc.vcl_ccout.length,txJson.vcl_ccout.length);
          assert.equal(txJson.vcl_ccout.length,0);

          //vft_ccout
          assert.equal(sc.vft_ccout.length,txJson.vft_ccout.length);
          for (var i=0; i<txJson.vft_ccout.length;i++) {
            assert.equal(sc.vft_ccout[i].scid,txJson.vft_ccout[i].scid);
            assert.equal(tx.sc_params.vft_ccout[i].amount,txJson.vft_ccout[i].value);
            assert.equal(sc.vft_ccout[i].address,txJson.vft_ccout[i].address);
          }

          //serialize
          assert.equal(tx.toBuffer().toString('hex'),hexa);

          //create transaction from existing transaction
          var new_Tx =  Transaction(tx.toObject());         
          assert.equal(new_Tx.toBuffer().toString('hex'),tx.toBuffer().toString('hex'));
        }
      });
      index++;
    });
  });

});
