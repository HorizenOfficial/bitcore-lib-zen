'use strict';
/* jshint unused: false */

var should = require('chai').should();
var expect = require('chai').expect;
var _ = require('lodash');

var bitcore = require('../../..');
var Transaction = bitcore.Transaction;
var PrivateKey = bitcore.PrivateKey;
var Address = bitcore.Address;
var Script = bitcore.Script;
var Signature = bitcore.crypto.Signature;
var MultiSigScriptHashInput = bitcore.Transaction.Input.MultiSigScriptHash;

describe('MultiSigScriptHashInput', function() {

  var privateKey1 = new PrivateKey('cNhdP3VG43uVRPQCgk4QkwavWSHnbUoCjQirCxWmCbAEzVLgSE2x');
  var privateKey2 = new PrivateKey('cRQYm3PEL6x4uqG871ShiUf7rmtrE9HtYzk3qmAoEDJth5r7bur1');
  var privateKey3 = new PrivateKey('cMdUDReX9aH3r6dKVM8SPJubsZSqrKvag5jYHAHBBVLS4hutRcqK');
  var public1 = privateKey1.publicKey;
  var public2 = privateKey2.publicKey;
  var public3 = privateKey3.publicKey;
  var address = new Address('zrMgbokJSQS5SR8rXd6isroxYLYbdTdmwsF');

  var output = {
    address: 'zrGBx76LjQvK7TfomC6CQ3Wi28MyHfcGYiB',
    txId: 'b442e6ae1eea8c72ea70a3f3ea9ecc91adafd575ab7209cde3bad304f0c1605f',
    outputIndex: 0,
    script: new Script("522103739af07b8cded21a78df18ecd7263ed68fb3160ab6be6a7acbabb644a0acb580210236f07ee8662aa6357d41f3f3f0ec4eff59fd6f66349590bd915476d58ef02cae2102dae442eb46c4c49f887ef9dafdb3f8df48b6858f89004580baee862fe875a37453ae"),
    satoshis: 1000000
  };
  it('can count missing signatures', function() {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000);
    var input = transaction.inputs[0];

    input.countSignatures().should.equal(0);

    transaction.sign(privateKey1);
    input.countSignatures().should.equal(1);
    input.countMissingSignatures().should.equal(1);
    input.isFullySigned().should.equal(false);

    transaction.sign(privateKey2);
    input.countSignatures().should.equal(2);
    input.countMissingSignatures().should.equal(0);
    input.isFullySigned().should.equal(true);
  });
  it('returns a list of public keys with missing signatures', function() {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000);
    var input = transaction.inputs[0];

    _.every(input.publicKeysWithoutSignature(), function(publicKeyMissing) {
      var serialized = publicKeyMissing.toString();
      return serialized === public1.toString() ||
              serialized === public2.toString() ||
              serialized === public3.toString();
    }).should.equal(true);
    transaction.sign(privateKey1);
    _.every(input.publicKeysWithoutSignature(), function(publicKeyMissing) {
      var serialized = publicKeyMissing.toString();
      return serialized === public2.toString() ||
              serialized === public3.toString();
    }).should.equal(true);
  });
  it('can clear all signatures', function() {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000)
      .sign(privateKey1)
      .sign(privateKey2);

    var input = transaction.inputs[0];
    input.isFullySigned().should.equal(true);
    input.clearSignatures();
    input.isFullySigned().should.equal(false);
  });
  it('can estimate how heavy is the output going to be', function() {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000);
    var input = transaction.inputs[0];
    input._estimateSize().should.equal(147);
  });
  it('uses SIGHASH_ALL by default', function() {
    var transaction = new Transaction()
      .from(output, [public1, public2, public3], 2)
      .to(address, 1000000);
    var input = transaction.inputs[0];
    var sigs = input.getSignatures(transaction, privateKey1, 0);
    sigs[0].sigtype.should.equal(Signature.SIGHASH_ALL);
  });
});
