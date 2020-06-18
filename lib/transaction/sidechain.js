'use strict';

var _ = require('lodash');
var $ = require('../util/preconditions');
var BN = require('../crypto/bn');
var Hash = require('../crypto/hash');
var buffer = require('buffer');
var BufferWriter = require('../encoding/bufferwriter');
var BufferReader = require('../encoding/bufferreader');
var BufferUtil = require('../util/buffer');
var JSUtil = require('../util/js');

function Sidechain(params) {
  if (!(this instanceof Sidechain)) {
    return new Sidechain(params);
  }
  this.vsc_ccout = [];
  this.vft_ccout = [];

  if (params) {
    return this._fromObject(params);
  }
}

class Vsc_ccout {
    constructor (epoch_length, satoshis, satoshisBN, address, customData, constantData, certVk) {
        this.epoch_length = epoch_length;
        this.satoshis = satoshis;
        this.satoshisBN = satoshisBN;
        this.address = address;
        this.customData = customData
        this.constantData = constantData;
        this.certVk = certVk;
    }
}

class Vft_ccout {
    constructor (satoshis,satoshisBN, address, scid) {
        this.satoshis = satoshis;
        this.satoshisBN = satoshisBN;
        this.address = address;
        this.scid = scid;
    }
}

Sidechain.fromObject = function(obj) {
  $.checkArgument(_.isObject(obj));
  var sc = new Sidechain();
  return sc._fromObject(obj);
};

Sidechain.prototype._fromObject = function(params) {
  var vsc=[];
  _.each(params.vsc_ccout, function (vsc_ccout){
    var amounts = new Sidechain._checkAmount(vsc_ccout.satoshis);
    vsc.push(new Vsc_ccout(
      vsc_ccout.epoch_length,
      amounts[0],
      amounts[1],
      BufferUtil.reverse(new buffer.Buffer(vsc_ccout.address, 'hex')),
      new Buffer(vsc_ccout.customData, 'hex'),
      new Buffer(vsc_ccout.constantData, 'hex'),
      new Buffer(vsc_ccout.certVk, 'hex'),  
      ));
   });
  this.vsc_ccout = vsc;

  var vft=[];
  _.each(params.vft_ccout, function (vft_ccout){
        var amounts = new Sidechain._checkAmount(vft_ccout.satoshis);
        vft.push(new Vft_ccout(
            amounts[0],
            amounts[1],
            BufferUtil.reverse(new buffer.Buffer(vft_ccout.address, 'hex')),
            BufferUtil.reverse(new buffer.Buffer(vft_ccout.scid, 'hex'))
            )
         );
  });
  this.vft_ccout = vft;

  return this;
};


Sidechain._checkAmount = function(num) {
  var satoshis;
  var satoshisBN;
  if (num instanceof BN) {
        satoshisBN = num;
        satoshis = num.toNumber();
      } else if (_.isString(num)) {
        satoshis = parseInt(num);
        satoshisBN = BN.fromNumber(satoshis);
      } else {
        $.checkArgument(
          JSUtil.isNaturalNumber(num),
          'Output amount is not a natural number'
        );
        satoshisBN = BN.fromNumber(num);
        satoshis = num;
      }
      $.checkState(
        JSUtil.isNaturalNumber(satoshis),
        'Output satoshis is not a natural number'
      );
  return [satoshis,satoshisBN];
};



Sidechain.fromBufferReader = function(br) {
  var i;
  var sc = new Sidechain();

  // Read Vsc_ccout
  var n_vsc = br.readVarintNum();
  var withdrawal_epoch_length;
  var satoshisBN;
  var satoshis;
  var address;
  var customData_len;
  var customData;
  var constantData_len;
  var constantData;
  var certVk;

  for (i = 0; i < n_vsc; i++) {
    withdrawal_epoch_length = br.readInt32LE();
    var tmp = this._checkAmount(br.readUInt64LEBN());
    satoshis = tmp[0];
    satoshisBN = tmp[1];
    address = br.read(32);
    customData_len = br.readVarintNum();
    customData = br.read(customData_len);
    constantData_len = br.readVarintNum();
    constantData = br.read(constantData_len);
    certVk = br.read(1544);
    var vsc = new Vsc_ccout(withdrawal_epoch_length, satoshis, satoshisBN, address, customData, constantData, certVk);
    sc.vsc_ccout.push(vsc);
  }

  // Read Vft_ccout
  var n_vft = br.readVarintNum();
  for (i = 0; i < n_vft; i++) {
    var tmp = this._checkAmount(br.readUInt64LEBN());
    satoshis = tmp[0];
    satoshisBN = tmp[1];
    address = br.read(32);
    var scid = br.read(32);
    var vft = new Vft_ccout(satoshis, satoshisBN, address, scid);
    sc.vft_ccout.push(vft);
  }

  return sc;
};

Sidechain.prototype.toObject = Sidechain.prototype.toJSON = function toObject() {
  var vsc_ccouts = [];
  _.each(this.vsc_ccout, function(vsc_ccout) {
    var obj ={};
    obj.epoch_length = vsc_ccout.epoch_length;
    obj.satoshis = vsc_ccout.satoshis;
    obj.satoshisBN = vsc_ccout.satoshisBN
    obj.address = BufferUtil.reverse(vsc_ccout.address).toString('hex');
    obj.customData = vsc_ccout.customData.toString('hex');
    obj.constantData = vsc_ccout.constantData.toString('hex');
    obj.certVk = vsc_ccout.certVk.toString('hex');
    vsc_ccouts.push(obj);
  });

  var vft_ccouts = [];
  _.each(this.vft_ccout, function(vft_ccout) {
    var obj = {};
    obj.satoshis = vft_ccout.satoshis;
    obj.address = BufferUtil.reverse(vft_ccout.address).toString('hex');
    obj.scid = BufferUtil.reverse(vft_ccout.scid).toString('hex');
    vft_ccouts.push(obj);
  });

  var obj = {
    vsc_ccout: vsc_ccouts,
    vft_ccout: vft_ccouts
  };

  return obj;
};


Sidechain.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  //Write vsc size
  writer.writeVarintNum(this.vsc_ccout.length);
  //Write every vsc
  for (i = 0; i < this.vsc_ccout.length; i++) {
    writer.writeInt32LE(this.vsc_ccout[i].epoch_length);
    writer.writeUInt64LEBN(this.vsc_ccout[i].satoshisBN);
    writer.write(this.vsc_ccout[i].address);
    writer.writeVarintNum(this.vsc_ccout[i].customData.length)
    writer.write(this.vsc_ccout[i].customData);
    writer.writeVarintNum(this.vsc_ccout[i].constantData.length)
    writer.write(this.vsc_ccout[i].constantData);
    writer.write(this.vsc_ccout[i].certVk);
  }

  //Write vft size
  writer.writeVarintNum(this.vft_ccout.length);
  //Write every vft
  for (i = 0; i < this.vft_ccout.length; i++) {
    writer.writeUInt64LEBN(this.vft_ccout[i].satoshisBN);
    writer.write(this.vft_ccout[i].address);
    writer.write(this.vft_ccout[i].scid);
  }

  return writer;
};

function calculateSidechainId(transactionHash, position){
  var buf1 =  BufferUtil.reverse(new buffer.Buffer(transactionHash, 'hex'));
  var buf2 =  BufferUtil.reverse(BufferUtil.integerAsBuffer(position));
  var buf3 = Buffer.concat([buf1,buf2]);
  return BufferUtil.reverse(Hash.sha256sha256(buf3)).toString('hex');
}

module.exports = {Sidechain, calculateSidechainId};
