'use strict';

var bitcore = require('../..');
var BN = require('../../lib/crypto/bn');
var BufferReader = bitcore.encoding.BufferReader;
var BufferWriter = bitcore.encoding.BufferWriter;
var BlockHeader = bitcore.BlockHeader;
var Block = bitcore.Block;
var chai = require('chai');
var fs = require('fs');
var should = chai.should();
var Transaction = bitcore.Transaction;

// https://test-insight.bitpay.com/block/000000000b99b16390660d79fcc138d2ad0c89a0d044c4201a02bdf1f61ffa11
var dataJson = fs.readFileSync('test/data/blk642579-testnet.json').toString();
var data = require('../data/blk642579-testnet');
var dataBlocks = require('../data/bitcoind/blocks');

describe('Block', function() {

  var blockhex = data.blockhex;
  var blockbuf = new Buffer(blockhex, 'hex');
  var bh = BlockHeader.fromBuffer(new Buffer(data.blockheaderhex, 'hex'));

 /*
 var txs = [];
  JSON.parse(dataJson).transactions.forEach(function(tx) {
    txs.push(new Transaction().fromObject(tx));
  });
  */
 var genesishex = '040000000000000000000000000000000000000000000000000000000000000000000000427dbf0ae8e079c6527ea1cb308c6e3c98fa5435f4d715d31176ea00cf2b61190000000000000000000000000000000000000000000000000000000000000000b6fe14590f0f0f203d000000000000000000000000000000000000000000000000000000000000002400cba7185285f4ff37432e1f3aa7a569fbc81b5a0876f23da8d38840b0130c74e68297b50101000000010000000000000000000000000000000000000000000000000000000000000000ffffffff5004ffff001d0104485a636c617373696338363034313361666532303761613137336166656534666366613931363664633734353635316337353461343165613866313535363436663561613832386163ffffffff010000000000000000434104678afdb0fe5548271967f1a67130b7105cd6a828e03909a67962e0ea1f61deb649f6bc3f4cef38c4f35504e51ec112de5c384df7ba0b8d578a4c702b6bf11d5fac00000000';
 var genesisbuf = new Buffer(genesishex, 'hex');
 var genesisidhex = '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f';


  it('should make a new block', function() {
    var b = Block(blockbuf);
    b.toBuffer().toString('hex').should.equal(blockhex);
  });

  it('should not make an empty block', function() {
    (function() {
      return new Block();
    }).should.throw('Unrecognized argument for Block');
  });

  it('should parse correctly transactions', function() {
      var b = Block(blockbuf);
      var txList = b.transactions;
      txList.length.should.equal(2);
      txList[0].id.should.equal(JSON.parse(dataJson).transactions[0].hash);
      txList[1].id.should.equal(JSON.parse(dataJson).transactions[1].hash);
  });


/*
  describe('#constructor', function() {

    it('should set these known values', function() {
      var b = new Block({
        header: bh,
        transactions: []
      });
      should.exist(b.header);
      //should.exist(b.transactions);
    });


    it('should properly deserialize blocks', function() {
      dataBlocks.forEach(function(block) {
        var b = Block.fromBuffer(new Buffer(block.data, 'hex'));
        b.transactions.length.should.equal(block.transactions);
      });
    });


  });*/


 /*

  describe('#fromRawBlock', function() {

    it('should instantiate from a raw block binary', function() {
      var x = Block.fromRawBlock(dataRawBlockBinary);
      x.header.version.should.equal(2);
      new BN(x.header.bits).toString('hex').should.equal('1c3fffc0');
    });

    it('should instantiate from raw block buffer', function() {
      var x = Block.fromRawBlock(dataRawBlockBuffer);
      x.header.version.should.equal(2);
      new BN(x.header.bits).toString('hex').should.equal('1c3fffc0');
    });

  });

  describe('#fromJSON', function() {

    it('should set these known values', function() {
      var block = Block.fromObject(JSON.parse(json));
      should.exist(block.header);
      should.exist(block.transactions);
    });

    it('should set these known values', function() {
      var block = new Block(JSON.parse(json));
      should.exist(block.header);
      should.exist(block.transactions);
    });

  });

  describe('#toJSON', function() {

    it('should recover these known values', function() {
      var block = Block.fromObject(JSON.parse(json));
      var b = block.toJSON();
      should.exist(b.header);
      should.exist(b.transactions);
    });

  });

  describe('#fromString/#toString', function() {

    it('should output/input a block hex string', function() {
      var b = Block.fromString(blockhex);
      b.toString().should.equal(blockhex);
    });

  });

  describe('#fromBufferReader', function() {

    it('should make a block from this known buffer', function() {
      var block = Block.fromBufferReader(BufferReader(blockbuf));
      block.toBuffer().toString('hex').should.equal(blockhex);
    });

  });

  describe('#toBuffer', function() {

    it('should recover a block from this known buffer', function() {
      var block = Block.fromBuffer(blockbuf);
      block.toBuffer().toString('hex').should.equal(blockhex);
    });

  });

  describe('#toBufferWriter', function() {

    it('should recover a block from this known buffer', function() {
      var block = Block.fromBuffer(blockbuf);
      block.toBufferWriter().concat().toString('hex').should.equal(blockhex);
    });

    it('doesn\'t create a bufferWriter if one provided', function() {
      var writer = new BufferWriter();
      var block = Block.fromBuffer(blockbuf);
      block.toBufferWriter(writer).should.equal(writer);
    });

  });

  describe('#toObject', function() {

    it('should recover a block from genesis block buffer', function() {
      var block = Block.fromBuffer(blockOneBuf);
      block.id.should.equal(blockOneId);
      block.toObject().should.deep.equal({
        header: {
          hash: '00000000839a8e6886ab5951d76f411475428afc90947ee320161bbf18eb6048',
          version: 1,
          prevHash: '000000000019d6689c085ae165831e934ff763ae46a2a6c172b3f1b60a8ce26f',
          merkleRoot: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
          time: 1231469665,
          bits: 486604799,
          nonce: 2573394689
        },
        transactions: [{
          hash: '0e3e2357e806b6cdb1f70b54c3a3a17b6714ee1f0e68bebb44a74b1efd512098',
          version: 1,
          inputs: [{
            prevTxId: '0000000000000000000000000000000000000000000000000000000000000000',
            outputIndex: 4294967295,
            sequenceNumber: 4294967295,
            script: '04ffff001d0104'
          }],
          outputs: [{
            satoshis: 5000000000,
            script: '410496b538e853519c726a2c91e61ec11600ae1390813a627c66fb8be7947be63c' +
              '52da7589379515d4e0a604f8141781e62294721166bf621e73a82cbf2342c858eeac'
          }],
          nLockTime: 0
        }]
      });
    });

    it('roundtrips correctly', function() {
      var block = Block.fromBuffer(blockOneBuf);
      var obj = block.toObject();
      var block2 = Block.fromObject(obj);
      block2.toObject().should.deep.equal(block.toObject());
    });

  });

  describe('#_getHash', function() {

    it('should return the correct hash of the genesis block', function() {
      var block = Block.fromBuffer(genesisbuf);
      var blockhash = new Buffer(Array.apply([], new Buffer(genesisidhex, 'hex')).reverse());
      block._getHash().toString('hex').should.equal(blockhash.toString('hex'));
    });
  });

  describe('#id', function() {

    it('should return the correct id of the genesis block', function() {
      var block = Block.fromBuffer(genesisbuf);
      block.id.should.equal(genesisidhex);
    });
    it('"hash" should be the same as "id"', function() {
      var block = Block.fromBuffer(genesisbuf);
      block.id.should.equal(block.hash);
    });

  });


  describe('#inspect', function() {
    it('should return the correct inspect of the genesis block', function() {
      var block = Block.fromBuffer(genesisbuf);
      block.inspect().should.equal('<Block ' + genesisidhex + '>');
    });
  });
  */

  describe('#merkleRoot', function() {

    it('should describe as valid merkle root', function() {
      var x =  Block(blockbuf);
      var valid = x.validMerkleRoot();
      valid.should.equal(true);
    });

    it('should describe as invalid merkle root', function() {
      var x =  Block(blockbuf);
      x.transactions.push(new Transaction());
      var valid = x.validMerkleRoot();
      valid.should.equal(false);
    });

    it('should get a null hash merkle root', function() {
      var x =  Block(blockbuf);
      x.transactions = []; // empty the txs
      var mr = x.getMerkleRoot();
      mr.should.deep.equal(Block.Values.NULL_HASH);
    });

  });


});
