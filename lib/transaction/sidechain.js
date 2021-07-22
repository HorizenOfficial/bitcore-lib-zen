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
  this.vcsw =  [];
  this.vsc_ccout = [];
  this.vft_ccout = [];
  this.vmbtr_out = [];

  if (params) {
    return this._fromObject(params);
  }
}

class Vsc_ccout {
    constructor (epoch_length, satoshis, satoshisBN, address, customData, constantData, certVk, wCeasedVk,
                 vFieldElementCertificateFieldConfig, vBitVectorCertificateFieldConfig, forwardTransferScFee, forwardTransferScFeeBN, mainchainBackwardTransferScFee, mainchainBackwardTransferScFeeBN, mbtrRequestDataLength) {
        this.epoch_length = epoch_length;
        this.satoshis = satoshis;
        this.satoshisBN = satoshisBN;
        this.address = address;
        this.customData = customData
        this.constantData = constantData;
        this.certVk = certVk;
        this.wCeasedVk = wCeasedVk;
        this.vFieldElementCertificateFieldConfig = vFieldElementCertificateFieldConfig;
        this.vBitVectorCertificateFieldConfig = vBitVectorCertificateFieldConfig;
        this.forwardTransferScFee = forwardTransferScFee;
        this.forwardTransferScFeeBN = forwardTransferScFeeBN;
        this.mainchainBackwardTransferScFee = mainchainBackwardTransferScFee;
        this.mainchainBackwardTransferScFeeBN = mainchainBackwardTransferScFeeBN;
        this.mbtrRequestDataLength = mbtrRequestDataLength;
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
    var amountsforwardTransferScFee = new Sidechain._checkAmount(vsc_ccout.forwardTransferScFee);
    var amountsmainchainBackwardTransferScFee = new Sidechain._checkAmount(vsc_ccout.mainchainBackwardTransferScFee);
    vsc.push(new Vsc_ccout(
      vsc_ccout.epoch_length,
      amounts[0],
      amounts[1],
      BufferUtil.reverse(new buffer.Buffer(vsc_ccout.address, 'hex')),
      new Buffer(vsc_ccout.customData, 'hex'),
      vsc_ccout.constantData ? new Buffer(vsc_ccout.constantData, 'hex') : undefined,
      new Buffer(vsc_ccout.certVk, 'hex'),
        vsc_ccout.wCeasedVk ? new Buffer(vsc_ccout.wCeasedVk, 'hex') : undefined,
      vsc_ccout.vFieldElementCertificateFieldConfig,
      vsc_ccout.vBitVectorCertificateFieldConfig,
      amountsforwardTransferScFee[0],
      amountsforwardTransferScFee[1],
      amountsmainchainBackwardTransferScFee[0],
      amountsmainchainBackwardTransferScFee[1],
      vsc_ccout.mbtrRequestDataLength
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
  this.vmbtr_out = params.vmbtr_out //TODO
  this.vcsw = params.vcsw //TODO

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
  var i,j,y;
  var sc = new Sidechain();

  //Read Vcsw
  var n_vcsw = br.readVarintNum();
  var vcsw = [];

  for (i=0; i<n_vcsw; i++) {
    //TODO
  }
  sc.vcsw = vcsw;

  // Read Vsc_ccout
  var n_vsc = br.readVarintNum();
  var withdrawal_epoch_length, satoshisBN, satoshis, address, customData_len, customData,
      constantData_len, constantData, constantData_option, certVk, certVk_len,
      wCeasedVk_len, wCeasedVk, wCeasedVk_option,
      vFieldElementCertificateFieldConfig_len,
      vBitVectorCertificateFieldConfig_len,
      forwardTransferScFee,
      forwardTransferScFeeBN,
      mainchainBackwardTransferScFee,
      mainchainBackwardTransferScFeeBN,
      mbtrRequestDataLength
      ;
  var vFieldElementCertificateFieldConfig = [];
  var vBitVectorCertificateFieldConfig = [];

  for (i = 0; i < n_vsc; i++) {
    withdrawal_epoch_length = br.readInt32LE();
    var tmp = this._checkAmount(br.readUInt64LEBN());
    satoshis = tmp[0];
    satoshisBN = tmp[1];
    address = br.read(32);
    customData_len = br.readVarintNum();
    customData = br.read(customData_len);
    constantData_option = br.readVarintNum();
    if (constantData_option == 1) {
      constantData_len = br.readVarintNum();
      constantData = br.read(constantData_len);
    }
    certVk_len = br.readVarintNum();
    certVk = br.read(certVk_len);
    wCeasedVk_option = br.readVarintNum();
    if (wCeasedVk_option == 1) {
      wCeasedVk_len = br.readVarintNum();
      wCeasedVk = br.read(wCeasedVk_len);
    }
    vFieldElementCertificateFieldConfig_len = br.readVarintNum();
    for (j = 0; j < vFieldElementCertificateFieldConfig_len; j++) {
      vFieldElementCertificateFieldConfig.push(br.readUInt8());
    }
    vBitVectorCertificateFieldConfig_len = br.readVarintNum();
    for (y = 0; y < vBitVectorCertificateFieldConfig_len; y++) {
      var vBitVectorCertificateFieldConfig_bitVector = br.readUInt32LE();
      var vBitVectorCertificateFieldConfig_maxCompressedSize = br.readUInt32LE();
      vBitVectorCertificateFieldConfig.push([vBitVectorCertificateFieldConfig_bitVector, vBitVectorCertificateFieldConfig_maxCompressedSize]);
    }
    tmp = this._checkAmount(br.readUInt64LEBN());
    forwardTransferScFee = tmp[0];
    forwardTransferScFeeBN = tmp[1];
    tmp = this._checkAmount(br.readUInt64LEBN());
    mainchainBackwardTransferScFee = tmp[0];
    mainchainBackwardTransferScFeeBN = tmp[1];
    mbtrRequestDataLength = br.readUInt8();

    var vsc = new Vsc_ccout(withdrawal_epoch_length, satoshis, satoshisBN, address, customData, constantData, certVk,
        wCeasedVk, vFieldElementCertificateFieldConfig, vBitVectorCertificateFieldConfig, forwardTransferScFee, forwardTransferScFeeBN,
        mainchainBackwardTransferScFee, mainchainBackwardTransferScFeeBN, mbtrRequestDataLength);
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

  var n_vmbtr_out = br.readVarintNum();
  var vmbtr_out = [];
  for (i=0; i<n_vmbtr_out; i++) {
    //TODO
  }
  sc.vmbtr_out = vmbtr_out
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
    obj.certVk = vsc_ccout.certVk.toString('hex');
    obj.customData = vsc_ccout.customData.toString('hex');
    if (vsc_ccout.constantData) {
      obj.constantData = vsc_ccout.constantData.toString('hex');
    }
    if (vsc_ccout.wCeasedVk) {
      obj.wCeasedVk = vsc_ccout.wCeasedVk.toString('hex');
    }
    obj.vFieldElementCertificateFieldConfig =  vsc_ccout.vFieldElementCertificateFieldConfig;
    obj.vBitVectorCertificateFieldConfig = vsc_ccout.vBitVectorCertificateFieldConfig;
    obj.forwardTransferScFee = vsc_ccout.forwardTransferScFee;
    obj.forwardTransferScFeeBN = vsc_ccout.forwardTransferScFeeBN;
    obj.mainchainBackwardTransferScFee = vsc_ccout.mainchainBackwardTransferScFee;
    obj.mainchainBackwardTransferScFeeBN = vsc_ccout.mainchainBackwardTransferScFeeBN;
    obj.mbtrRequestDataLength = vsc_ccout.mbtrRequestDataLength;
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
    vcsw: this.vcsw,
    vsc_ccout: vsc_ccouts,
    vft_ccout: vft_ccouts,
    vmbtr_out: this.vmbtr_out
  };

  return obj;
};


Sidechain.prototype.toBufferWriter = function(writer) {
  var i;
  if (!writer) {
    writer = new BufferWriter();
  }
  //Write vcsw
  writer.writeVarintNum(this.vcsw.length);
  //TODO: write vcsw

  //Write vsc size
  writer.writeVarintNum(this.vsc_ccout.length);
  //Write every vsc
  for (i = 0; i < this.vsc_ccout.length; i++) {
    writer.writeInt32LE(this.vsc_ccout[i].epoch_length);
    writer.writeUInt64LEBN(this.vsc_ccout[i].satoshisBN);
    writer.write(this.vsc_ccout[i].address);
    writer.writeVarintNum(this.vsc_ccout[i].customData.length)
    writer.write(this.vsc_ccout[i].customData);
    if (this.vsc_ccout[i].constantData) {
      writer.writeVarintNum(1)
      writer.writeVarintNum(this.vsc_ccout[i].constantData.length)
      writer.write(this.vsc_ccout[i].constantData);
    } else {
      writer.writeVarintNum(0)
    }
    writer.writeVarintNum(this.vsc_ccout[i].certVk.length);
    writer.write(this.vsc_ccout[i].certVk);

    if (this.vsc_ccout[i].wCeasedVk) {
      writer.writeVarintNum(1)
      writer.writeVarintNum(this.vsc_ccout[i].wCeasedVk.length)
      writer.write(this.vsc_ccout[i].wCeasedVk)
    } else {
      writer.writeVarintNum(0)
    }

    writer.writeVarintNum(this.vsc_ccout[i].vFieldElementCertificateFieldConfig.length)
    for (var el of this.vsc_ccout[i].vFieldElementCertificateFieldConfig) {
      writer.writeUInt8(el)
    }
    writer.writeVarintNum(this.vsc_ccout[i].vBitVectorCertificateFieldConfig.length)
    for (var el of this.vsc_ccout[i].vBitVectorCertificateFieldConfig) {
      writer.writeInt32LE(el[0])
      writer.writeInt32LE(el[1])
    }
    writer.writeUInt64LEBN(this.vsc_ccout[i].forwardTransferScFeeBN)
    writer.writeUInt64LEBN(this.vsc_ccout[i].mainchainBackwardTransferScFeeBN)
    writer.writeUInt8(this.vsc_ccout[i].mbtrRequestDataLength)
  }

  //Write vft size
  writer.writeVarintNum(this.vft_ccout.length);
  //Write every vft
  for (i = 0; i < this.vft_ccout.length; i++) {
    writer.writeUInt64LEBN(this.vft_ccout[i].satoshisBN);
    writer.write(this.vft_ccout[i].address);
    writer.write(this.vft_ccout[i].scid);
  }
  //Write vmbtr_out
  writer.writeVarintNum(this.vmbtr_out.length);

  return writer;
};

module.exports = {Sidechain};
