'use strict';

var _ = require('lodash');
var BN = require('../crypto/bn');
var buffer = require('buffer');
var bufferUtil = require('../util/buffer');
var JSUtil = require('../util/js');
var BufferWriter = require('../encoding/bufferwriter');
var Script = require('../script');
var $ = require('../util/preconditions');
var errors = require('../errors');
var Opcode = require('../opcode');
var BufferUtil = require('../util/buffer');
var MAX_SAFE_INTEGER = 0x1fffffffffffff;

function Output(args) {
  if (!(this instanceof Output)) {
    return new Output(args);
  }
  if (_.isObject(args)) {
    this.satoshis = args.satoshis;

    if (bufferUtil.isBuffer(args.script)) {
      this._scriptBuffer = args.script;
    } else {
      var script;
      if (_.isString(args.script) && JSUtil.isHexa(args.script)) {
        script = new buffer.Buffer(args.script, 'hex');
      } else {
        script = args.script;
      }
      this.setScript(script);
    }

    if (args.isFromBackwardTransfer){
      this._isFromBackwardTransfer = true;
      this._pubKeyHash = Buffer.from(args.pubKeyHash, 'hex');

    }

  } else {
    throw new TypeError('Unrecognized argument for Output');
  }
}

/*
* In memory-only property, is not persisted for backward compatibility.
* Is set to true only for vout representing a sidechain backward tranfer.
* The transaction that will create this kind of output will be responsible to set this flag.
*/
Object.defineProperty(Output.prototype, 'isFromBackwardTransfer', {
  configurable: false,
  enumerable: true,
  get: function() {
     return this._isFromBackwardTransfer ? this._isFromBackwardTransfer : false;
  },
  set: function(val) {
    return this._isFromBackwardTransfer = val;
 }
});

Object.defineProperty(Output.prototype, 'script', {
  configurable: false,
  enumerable: true,
  get: function() {
    if (this._script) {
      return this._script;
    } else {
      this.setScriptFromBuffer(this._scriptBuffer);
      return this._script;
    }

  }
});

Object.defineProperty(Output.prototype, 'satoshis', {
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

Output.prototype.invalidSatoshis = function() {
  if (this._satoshis > MAX_SAFE_INTEGER) {
    return 'transaction txout satoshis greater than max safe integer';
  }
  if (this._satoshis !== this._satoshisBN.toNumber()) {
    return 'transaction txout satoshis has corrupted value';
  }
  if (this._satoshis < 0) {
    return 'transaction txout negative';
  }
  return false;
};

Output.prototype.toObject = Output.prototype.toJSON = function toObject() {
  var obj = {
    satoshis: this.satoshis
  };
  if (this._isFromBackwardTransfer){
    obj.isFromBackwardTransfer = true;
    obj.pubKeyHash = this._pubKeyHash.toString('hex')
    obj.script = this._scriptBuffer.toString('hex');
  }else{
    obj.script = this._scriptBuffer.toString('hex');
  }

  return obj;
};

Output.fromObject = function(data) {
  return new Output(data);
};

Output.prototype.setScriptFromBuffer = function(buffer) {
  this._scriptBuffer = buffer;
  try {
    this._script = Script.fromBuffer(this._scriptBuffer);
    this._script._isOutput = true;
  } catch(e) {
    if (e instanceof errors.Script.InvalidBuffer) {
      this._script = null;
    } else {
      throw e;
    }
  }
};

Output.prototype.setScript = function(script) {
  if (script instanceof Script) {
    this._scriptBuffer = script.toBuffer();
    this._script = script;
    this._script._isOutput = true;
  } else if (_.isString(script)) {
    this._script = Script.fromString(script);
    this._scriptBuffer = this._script.toBuffer();
    this._script._isOutput = true;
  } else if (bufferUtil.isBuffer(script)) {
    this.setScriptFromBuffer(script);
  } else {
    throw new TypeError('Invalid argument type: script');
  }
  return this;
};

Output.prototype.inspect = function() {
  var scriptStr;
  if (this.script) {
    scriptStr = this.script.inspect();
  } else {
    scriptStr = this._scriptBuffer.toString('hex');
  }
  return '<Output (' + this.satoshis + ' sats) ' + scriptStr + '>';
};

Output.fromBufferReader = function(br, isFromBackwardTransfer) {

  var obj = {};
  obj.satoshis = br.readUInt64LEBN();
  if (isFromBackwardTransfer){
    obj.pubKeyHash = br.read(20);
    obj.isFromBackwardTransfer = true;
    var s = new Script();
    s.add(Opcode.OP_DUP)
        .add(Opcode.OP_HASH160)
        .add(obj.pubKeyHash)
        .add(Opcode.OP_EQUALVERIFY)
        .add(Opcode.OP_CHECKSIG);
    obj.script = s;
  } else {
    var size = br.readVarintNum();
    if (size !== 0) {
      obj.script = br.read(size);
    } else {
      obj.script = new buffer.Buffer([]);
    }
  }

  return new Output(obj);
};


Output.prototype.toBufferWriter = function(writer) {
  if (!writer) {
    writer = new BufferWriter();
  }
  writer.writeUInt64LEBN(this._satoshisBN);
  if (this._isFromBackwardTransfer){
    writer.write(Buffer.from(this._pubKeyHash, 'hex'));
  }else{
    var script = this._scriptBuffer;
    writer.writeVarintNum(script.length);
    writer.write(script);
  }

  return writer;
};

module.exports = Output;
