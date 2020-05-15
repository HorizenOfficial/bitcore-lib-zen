'use strict';

var should = require('chai').should();
var bitcore = require('../../..');
var Transaction = bitcore.Transaction;
var PrivateKey = bitcore.PrivateKey;

describe('PublicKeyInput', function() {

  var utxo = {
    txid: '7f3b688cb224ed83e12d9454145c26ac913687086a0a62f2ae0bc10934a4030f',
    vout: 0,
    address: 'ztXNeZommE2XhMoJ2o55QwiwDDeueu4BhEg',
    scriptPubKey: '76a9142e46b91e940ad6e1f7578de6dba2d14d130c58f888ac',
    amount: 50,
    confirmations: 104,
    spendable: true
  };
  var privateKey = PrivateKey.fromWIF('cPwbaLor1Fyem32fk8AJzp3LGt3jkC4Uzrn6ymp5FaVwktXzwCvx');
  var address = privateKey.toAddress();
  utxo.address.should.equal(address.toString());

  var destKey = new PrivateKey();

  it('will correctly sign a publickey out transaction', function() {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    tx.sign(privateKey);
    tx.inputs[0].script.toBuffer().length.should.be.above(0);
  });

  it('count can count missing signatures', function() {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    input.isFullySigned().should.equal(false);
    tx.sign(privateKey);
    input.isFullySigned().should.equal(true);
  });

  it('it\'s size can be estimated', function() {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    input._estimateSize().should.equal(107);
  });

  it('it\'s signature can be removed', function() {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    tx.sign(privateKey);
    input.isFullySigned().should.equal(true);
    input.clearSignatures();
    input.isFullySigned().should.equal(false);
  });

  it('returns an empty array if private key mismatches', function() {
    var tx = new Transaction();
    tx.from(utxo);
    tx.to(destKey.toAddress(), 10000);
    var input = tx.inputs[0];
    var signatures = input.getSignatures(tx, new PrivateKey(), 0);
    signatures.length.should.equal(0);
  });

});
