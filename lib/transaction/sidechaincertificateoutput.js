'use strict';

var _ = require('lodash');
var BN = require('../crypto/bn');
var bufferUtil = require('../util/buffer');
var JSUtil = require('../util/js');
var BufferWriter = require('../encoding/bufferwriter');
var BufferReader = require('../encoding/bufferreader');
var $ = require('../util/preconditions');
var BufferUtil = require('../util/buffer');
var Address = require('../address');


function SidechainCertificateOutput(params) {
  if (!(this instanceof SidechainCertificateOutput)) {
    return new SidechainCertificateOutput(params);
  }

  this._satoshis = undefined;
  this._pubKeyHash = undefined;

  if (_.isObject(params)){
    this.satoshis = params.satoshis; 
    if (JSUtil.isHexa(params.pubKeyHash)) {
      this._pubKeyHash = BufferUtil.reverse(Buffer.from(params.pubKeyHash, 'hex'));
    }else if  (bufferUtil.isBuffer(params.pubKeyHash)) {
      this._pubKeyHash = params.pubKeyHash;
    }
  } else {
    throw new TypeError('Unrecognized argument for SidechainCertificateOutput');
  }
}


Object.defineProperty(SidechainCertificateOutput.prototype, 'satoshis', {
  configurable: false,
  enumerable: true,
  get: function() {
    return this._satoshis;
  },
  set: function(num) {
    if (num instanceof BN) {
      this._satoshisBN = num;
      this._satoshis = num.toNumber();
    } else if (_.isString(num)) {
      this._satoshis = parseInt(num);
      this._satoshisBN = BN.fromNumber(this._satoshis);
    } else {
      $.checkArgument(
        JSUtil.isNaturalNumber(num),
        'Output satoshis is not a natural number'
      );
      this._satoshisBN = BN.fromNumber(num);
      this._satoshis = num;
    }
    $.checkState(
      JSUtil.isNaturalNumber(this._satoshis),
      'Output satoshis is not a natural number'
    );
  }
});

var pubKeyHashProperty = {
  configurable: false,
  enumerable: true,
  get: function() {
    return BufferUtil.reverse(this._pubKeyHash).toString('hex')
  }
};
Object.defineProperty(SidechainCertificateOutput.prototype, 'pubKeyHash', pubKeyHashProperty);

/**
 * @param {Network=} network
 * @return {Address|boolean} the associated address for this output 
 */
SidechainCertificateOutput.prototype.getAddress = function(network) {
  return Address(this._pubKeyHash, network).toString(true);
};

SidechainCertificateOutput.prototype.toObject = SidechainCertificateOutput.prototype.toJSON = function toObject() {
  var obj = {
    satoshis: this.satoshis,
    pubKeyHash:  this.pubKeyHash,
  };
  return obj;
};


SidechainCertificateOutput.fromString = function(string) {
  return this.fromBuffer(Buffer.from(string, 'hex'));
};


SidechainCertificateOutput.fromBuffer = function(buffer) {
  var reader = new BufferReader(buffer);
  return this.fromBufferReader(reader);
};

SidechainCertificateOutput.fromBufferReader = function(br) {
  var obj = {};
  obj.satoshis = br.readUInt64LEBN();
  obj.pubKeyHash = br.read(20);
  return new SidechainCertificateOutput(obj);
};

SidechainCertificateOutput.prototype.toBufferWriter = function(writer) {
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.writeUInt64LEBN(this._satoshisBN);
  writer.write(this._pubKeyHash);
  return writer;
};

module.exports = SidechainCertificateOutput;