'use strict';

var _ = require('lodash');
var $ = require('../util/preconditions');
var BN = require('../crypto/bn');
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
  this.vcl_ccout = [];

  if (params) {
    return this._fromObject(params);
  }
}

class Vsc_ccout {
    constructor (scid, epoch_length, value, valueBN, address, customData) {
        this.scid = scid;
        this.epoch_length = epoch_length;
        this.value = value;
        this.valueBN = valueBN;
        this.address = address;
        this.customData = customData
    }
}

class Vft_ccout {
    constructor (amount,amountBN, address, scid) {
        this.amount = amount;
        this.amountBN=amountBN;
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
    vsc.push(new Vsc_ccout(BufferUtil.reverse(new buffer.Buffer(vsc_ccout.scid, 'hex')),vsc_ccout.epoch_length,vsc_ccout.value,vsc_ccout.valueBN,BufferUtil.reverse(new buffer.Buffer(vsc_ccout.address, 'hex')),new Buffer(vsc_ccout.customData)));
   });
  this.vsc_ccout = vsc;

  this.vcl_ccout = params.vcl_ccout;

  var vft=[];
  _.each(params.vft_ccout, function (vft_ccout){
        var amounts = new Sidechain._checkAmount(vft_ccout.amount);
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
  var amount;
  var amountBN;
  if (num instanceof BN) {
        amountBN = num;
        amount = num.toNumber();
      } else if (_.isString(num)) {
        amount = parseInt(num);
        amountBN = BN.fromNumber(amount);
      } else {
        $.checkArgument(
          JSUtil.isNaturalNumber(num),
          'Output amount is not a natural number'
        );
        amountBN = BN.fromNumber(num);
        amount = num;
      }
      $.checkState(
        JSUtil.isNaturalNumber(amount),
        'Output satoshis is not a natural number'
      );
  return [amount/100000000,amountBN];
};



Sidechain.fromBufferReader = function(br) {
  var i;
  var sc = new Sidechain();

  // Read Vsc_ccout
  var n_vsc = br.readVarintNum();
  var scid;
  var withdrawal_epoch_length;
  var amountBN;
  var amount;
  var address;
  var customData_len;
  var customData;

  for (i = 0; i < n_vsc; i++) {
    scid = br.read(32);
    withdrawal_epoch_length = br.readInt32LE();
    var tmp = this._checkAmount(br.readUInt64LEBN());
    amount = tmp[0];
    amountBN = tmp[1];
    address = br.read(32);
    customData_len = br.readVarintNum();
    customData = br.read(customData_len);
    var vsc = new Vsc_ccout (scid,withdrawal_epoch_length,amount,amountBN,address,customData);
    sc.vsc_ccout.push(vsc);
  }

  // Vcl_ccout not used
  br.read(1);

  // Read Vft_ccout
  var n_vft = br.readVarintNum();
  var amountBN;
  for (i = 0; i < n_vft; i++) {
    var tmp = this._checkAmount(br.readUInt64LEBN());
    amount = tmp[0];
    amountBN = tmp[1];
    address = br.read(32);
    scid = br.read(32);
    var vft = new Vft_ccout (amount, amountBN, address, scid);
    sc.vft_ccout.push(vft);
  }

  return sc;
};

Sidechain.prototype.toObject = Sidechain.prototype.toJSON = function toObject() {
  var vsc_ccouts = [];
  _.each(this.vsc_ccout, function(vsc_ccout) {
    var obj ={};
    obj.scid = BufferUtil.reverse(vsc_ccout.scid).toString('hex');
    obj.epoch_length = vsc_ccout.epoch_length;
    obj.value = vsc_ccout.value;
    obj.valueBN = vsc_ccout.valueBN
    obj.address = BufferUtil.reverse(vsc_ccout.address).toString('hex');
    obj.customData = vsc_ccout.customData.toString('hex');
    vsc_ccouts.push(obj);
  });

  var vcl_ccouts = [];

  var vft_ccouts = [];
  _.each(this.vft_ccout, function(vft_ccout) {
    var obj = {};
    obj.amount = vft_ccout.amount;
    obj.address = BufferUtil.reverse(vft_ccout.address).toString('hex');
    obj.scid = BufferUtil.reverse(vft_ccout.scid).toString('hex');
    vft_ccouts.push(obj);
  });

  var obj = {
    vsc_ccout: vsc_ccouts,
    vcl_ccout: vcl_ccouts,
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
    writer.write(this.vsc_ccout[i].scid);
    writer.writeInt32LE(this.vsc_ccout[i].epoch_length);
    writer.writeUInt64LEBN(this.vsc_ccout[i].valueBN);
    writer.write(this.vsc_ccout[i].address);
    writer.writeVarintNum(this.vsc_ccout[i].customData.length)
    writer.write(this.vsc_ccout[i].customData);
  }
  //Write vcl size (always 0)
  writer.writeVarintNum(this.vcl_ccout.length);

  //Write vft size
  writer.writeVarintNum(this.vft_ccout.length);
  //Write every vft
  for (i = 0; i < this.vft_ccout.length; i++) {
    writer.writeUInt64LEBN(this.vft_ccout[i].amountBN);
    writer.write(this.vft_ccout[i].address);
    writer.write(this.vft_ccout[i].scid);
  }

  return writer;
};

module.exports = Sidechain;
