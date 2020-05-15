'use strict';

var _ = require('lodash');
var $ = require('../util/preconditions');
var BN = require('../crypto/bn');
var BufferWriter = require('../encoding/bufferwriter');
var BufferReader = require('../encoding/bufferreader');
var BufferUtil = require('../util/buffer');
var JSUtil = require('../util/js');
var Output = require('./output');
var SidechainCertificateOutput = require('./sidechaincertificateoutput');
var Hash = require('../crypto/hash');

function SidechainCertificate(params) {
  if (!(this instanceof SidechainCertificate)) {
    return new SidechainCertificate(params);
  }
  if (_.isObject(params)) {
      this._fromObject(params);
  } else {
    throw new TypeError('Unrecognized argument for SidechainCertificate');
  }  
}

Object.defineProperty(SidechainCertificate.prototype, 'totalAmount', {
  configurable: false,
  enumerable: true,
  get: function() {
    return this._totalAmount;
  },
  set: function(num) {
    if (num instanceof BN) {
      this._totalAmountBN = num;
      this._totalAmount = num.toNumber();
    } else if (_.isString(num)) {
      this._totalAmount = parseInt(num);
      this._totalAmountBN = BN.fromNumber(this._totalAmount);
    } else {
      $.checkArgument(
        JSUtil.isNaturalNumber(num),
        'totalAmount is not a natural number'
      );
      this._totalAmountBN = BN.fromNumber(num);
      this._totalAmount = num;
    }
    $.checkState(
      JSUtil.isNaturalNumber(this._totalAmount),
      'totalAmount is not a natural number'
    );
  }
});


Object.defineProperty(SidechainCertificate.prototype, 'fee', {
  configurable: false,
  enumerable: true,
  get: function() {
    return this._fee;
  },
  set: function(num) {
    if (num instanceof BN) {
      this._feeBN = num;
      this._fee = num.toNumber();
    } else if (_.isString(num)) {
      this._fee = parseInt(num);
      this._feeBN = BN.fromNumber(this._fee);
    } else {
      $.checkArgument(
        JSUtil.isNaturalNumber(num),
        'totalAmount is not a natural number'
      );
      this._feeBN = BN.fromNumber(num);
      this._fee = num;
    }
    $.checkState(
      JSUtil.isNaturalNumber(this._fee),
      'totalAmount is not a natural number'
    );
  }
});

var hashProperty = {
  configurable: false,
  enumerable: true,
  get: function() {
    return new BufferReader(this._getHash()).readReverse().toString('hex');
  }
};
Object.defineProperty(SidechainCertificate.prototype, 'hash', hashProperty);
Object.defineProperty(SidechainCertificate.prototype, 'id', hashProperty);


SidechainCertificate.fromString = function(string) {
  return this.fromBuffer(Buffer.from(string, 'hex'));
};

SidechainCertificate.fromBuffer = function(buffer) {
  var reader = new BufferReader(buffer);
  return this.fromBufferReader(reader);
};

SidechainCertificate.fromBufferReader = function(br) {
  var obj = {};
  obj.version = br.readInt32LE();
  obj.sidechainId = BufferUtil.reverse(br.read(32)).toString('hex');
  obj.epochNumber = br.readInt32LE();
  obj.endEpochBlockHash = BufferUtil.reverse(br.read(32)).toString('hex');
  obj.totalAmount = br.readUInt64LEBN();
  obj.fee = br.readUInt64LEBN();

  // Read transactionOutput
  var transactionOutputCount = br.readVarintNum();
  obj.transactionOutputs = [];
  for (var i = 0; i < transactionOutputCount; i++) {
    obj.transactionOutputs.push(Output.fromBufferReader(br).toObject());
  }
  // Read output
  var outputCount = br.readVarintNum();
  obj.outputs = [];
  for (var i = 0; i < outputCount; i++) {
      obj.outputs.push(SidechainCertificateOutput.fromBufferReader(br).toObject());
  }
  obj.nonce = BufferUtil.reverse(br.read(32)).toString('hex');
  return new SidechainCertificate(obj);
};


SidechainCertificate.prototype._fromObject = function(params) {
  this.version = params.version;
  this.sidechainId = params.sidechainId;
  this.epochNumber = params.epochNumber;
  this.endEpochBlockHash = params.endEpochBlockHash;
  this.totalAmount = params.totalAmount;
  this.fee = params.fee;
  this.transactionOutputs = [];
  for (var i = 0; i < params.transactionOutputs.length; i++) {
    this.transactionOutputs.push(new Outputs(params.transactionOutputs[i]));
  }
  this.outputs = [];
  for (var i = 0; i < params.outputs.length; i++) {
    this.outputs.push(new SidechainCertificateOutput(params.outputs[i]));
  }
  this.nonce = params.nonce;  
};


SidechainCertificate.prototype.toObject = SidechainCertificate.prototype.toJSON = function toObject() {
  var transactionOutputs = [];
  this.transactionOutputs.forEach(function(output) {
    transactionOutputs.push(output.toObject());
  });
  var outputs = [];
  this.outputs.forEach(function(output) {
    outputs.push(output.toObject());
  });

  var obj = {
    version: this.version,
    sidechainId: this.sidechainId,
    epochNumber: this.epochNumber,
    endEpochBlockHash: this.endEpochBlockHash,
    totalAmount: this.totalAmount,
    fee: this.fee,
    nonce: this.nonce,
    outputs: outputs,
    transactionOutputs: transactionOutputs
  }; 
  return obj;
};

SidechainCertificate.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.writeInt32LE(this.version);
  writer.write(BufferUtil.reverse(Buffer.from(this.sidechainId, 'hex')));
  writer.writeInt32LE(this.epochNumber);
  writer.write(BufferUtil.reverse(Buffer.from(this.endEpochBlockHash, 'hex')));
  writer.writeUInt64LEBN(this._totalAmountBN);
  writer.writeUInt64LEBN(this._feeBN);
  writer.writeVarintNum(this.transactionOutputs.length);
  this.transactionOutputs.forEach(function(transactionOutput) {
    transactionOutput.toBufferWriter(writer);
  });
  writer.writeVarintNum(this.outputs.length);
  this.outputs.forEach(function(output) {
    output.toBufferWriter(writer);
  });
  writer.write(BufferUtil.reverse(Buffer.from(this.nonce, 'hex')));
  return writer;
};

SidechainCertificate.prototype.toBuffer = function() {
  var writer = new BufferWriter();
  return this.toBufferWriter(writer).toBuffer();
};

/**
 * Retrieve the little endian hash of the certificate
 * @return {Buffer}
 */
SidechainCertificate.prototype._getHash = function() {
  return Hash.sha256sha256(this.toBuffer());
};


module.exports = SidechainCertificate;
