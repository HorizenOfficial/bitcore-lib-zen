'use strict';

var _ = require('lodash');
var $ = require('../util/preconditions');
var BN = require('../crypto/bn');
var BufferWriter = require('../encoding/bufferwriter');
var BufferReader = require('../encoding/bufferreader');
var BufferUtil = require('../util/buffer');
var JSUtil = require('../util/js');
var Output = require('./output');
var Input = require('./input');
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


var hashProperty = {
  configurable: false,
  enumerable: true,
  get: function() {
    return new BufferReader(this._getHash()).readReverse().toString('hex');
  }
};
Object.defineProperty(SidechainCertificate.prototype, 'hash', hashProperty);
Object.defineProperty(SidechainCertificate.prototype, 'id', hashProperty);

var outputsProperty = {
  configurable: false,
  enumerable: true,
  get: function() {
    var ret = [];
    this.transactionOutputs.forEach(ele => {
      ret.push(ele);
    });
    this.backwardTransferOutputs.forEach(ele => {
      var output = ele.getTxOutput();
      ret.push(output);
    })
    return ret;
  }
};
Object.defineProperty(SidechainCertificate.prototype, 'outputs', outputsProperty);

var inputsProperty = {
  configurable: false,
  enumerable: true,
  get: function() {
    return this.transactionInputs;
  }
};
Object.defineProperty(SidechainCertificate.prototype, 'inputs', inputsProperty);

SidechainCertificate.prototype.getValueOfBackwardTransfers = function() {
  var amount = 0;
  this.backwardTransferOutputs.forEach(function(output) {
    amount = amount +output.satoshis;
  });
  return amount;
};

SidechainCertificate.prototype.getValueOfChange = function() {
  var amount = 0;
  this.transactionOutputs.forEach(function(output) {
    amount = amount +output.satoshis;
  });
  return amount;
};

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

  // Read transactionInput
  var transactionInputCount = br.readVarintNum();
  obj.transactionInputs = [];
  for (var i = 0; i < transactionInputCount; i++) {
    obj.transactionInputs.push(Input.fromBufferReader(br).toObject());
  }

  // Read transactionOutput
  var transactionOutputCount = br.readVarintNum();
  obj.transactionOutputs = [];
  for (var i = 0; i < transactionOutputCount; i++) {
    obj.transactionOutputs.push(Output.fromBufferReader(br).toObject());
  }
  // Read backwardTransferOutput
  var outputCount = br.readVarintNum();
  obj.backwardTransferOutputs = [];
  for (var i = 0; i < outputCount; i++) {
      obj.backwardTransferOutputs.push(SidechainCertificateOutput.fromBufferReader(br).toObject());
  }
  return new SidechainCertificate(obj);
};


SidechainCertificate.prototype._fromObject = function(params) {
  this.version = params.version;
  this.sidechainId = params.sidechainId;
  this.epochNumber = params.epochNumber;
  this.endEpochBlockHash = params.endEpochBlockHash;
  this.transactionInputs = [];
  for (var i = 0; i < params.transactionInputs.length; i++) {
    this.transactionInputs.push(new Input(params.transactionInputs[i]));
  }
  this.transactionOutputs = [];
  for (var i = 0; i < params.transactionOutputs.length; i++) {
    this.transactionOutputs.push(new Output(params.transactionOutputs[i]));
  }
  this.backwardTransferOutputs = [];
  for (var i = 0; i < params.backwardTransferOutputs.length; i++) {
    this.backwardTransferOutputs.push(new SidechainCertificateOutput(params.backwardTransferOutputs[i]));
  }
};


SidechainCertificate.prototype.toObject = SidechainCertificate.prototype.toJSON = function toObject() {
  var transactionInputs = [];
  this.transactionInputs.forEach(function(output) {
    transactionInputs.push(output.toObject());
  });
  var transactionOutputs = [];
  this.transactionOutputs.forEach(function(output) {
    transactionOutputs.push(output.toObject());
  });
  var backwardTransferOutputs = [];
  this.backwardTransferOutputs.forEach(function(output) {
    backwardTransferOutputs.push(output.toObject());
  });

  var obj = {
    version: this.version,
    sidechainId: this.sidechainId,
    epochNumber: this.epochNumber,
    endEpochBlockHash: this.endEpochBlockHash,
    transactionInputs: transactionInputs,
    transactionOutputs: transactionOutputs,
    backwardTransferOutputs: backwardTransferOutputs
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
  writer.writeVarintNum(this.transactionInputs.length);
  this.transactionInputs.forEach(function(transactionInput) {
    transactionInput.toBufferWriter(writer);
  });
  writer.writeVarintNum(this.transactionOutputs.length);
  this.transactionOutputs.forEach(function(transactionOutput) {
    transactionOutput.toBufferWriter(writer);
  });
  writer.writeVarintNum(this.backwardTransferOutputs.length);
  this.backwardTransferOutputs.forEach(function(bout) {
    bout.toBufferWriter(writer);
  });
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
