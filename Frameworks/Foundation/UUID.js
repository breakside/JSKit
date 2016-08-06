// #feature Uint8Array
// #import "Foundation/Uint8Array+JS.js"
// #import "Foundation/String+JS.js"
'use strict';

var UUID = function(version){
  if (this === undefined){
    return (new UUID()).string;
  }
  this.bytes = new Uint8Array(16);
  this.variant = 0x4;
  this.version = version || 0x4;
  if (this.version == 0x1){
    if (!UUID.hasOwnProperty('node')){
      throw Error('UUID.node has not been defined, so version 1 UUID is not supported.  Use version 4 or define a node factory in your environment.');
    }
    while (true){
      this._unix_timestamp = (new Date()).valueOf();
      this._unix_timestamp_tick = 0;
      if (this._unix_timestamp == this._last_unix_timestamp){
        if (UUID._last_unix_timestamp_tick < UUID._ticks_per_ms){
          ++UUID._last_unix_timestamp_tick;
          this._unix_timestamp_tick = UUID._last_unix_timestamp_tick;
          break;
        }
      }else{
        this._last_unix_timestamp = this._unix_timestamp;
        this._last_unix_timestamp_tick = this._unix_timestamp_tick;
        break;
      }
    }
    this.time = (this._unix_timestamp - UUID._epoch) * UUID._ticks_per_ms + this._unix_timestamp_tick;
    this.clock_sequence = Math.floor(Math.random() * 0x3FFF);
    this.node = UUID.node;
  }else if (this.version == 0x4){
    this.time = Math.floor(Math.random() * 0xFFFFFFFFFFFFFFF);
    this.clock_sequence = Math.floor(Math.random() * 0x3FFF);
    this.node = Math.floor(Math.random() * 0xFFFFFFFFFFFF);
  }else{
    throw Error('UUID version %d not supported.  Only versions 1 and 4 are available.'.sprintf(this.version));
  }
  var i = 0;
  var temp = this.time;
  // time_low
  for (i = 3; i >= 0; --i){
    this.bytes[i] = temp & 0xFFFF;
    temp = temp >>> 8;
  }
  // time_mid
  for (i = 5; i >= 4; --i){
    this.bytes[i] = temp & 0xFFFF;
    temp = temp >>> 8;
  }
  // time_high_and_version
  temp = (this.version << 12) | temp;
  for (i = 7; i >= 6; --i){
    this.bytes[i] = temp & 0xFFFF;
    temp = temp >>> 8;
  }
  // clock_seq_high_and_reserved
  this.bytes[8] = 0x40 | (this.clock_sequence >>> 8);
  // clock_seq_low
  this.bytes[9] = this.clock_sequence & 0xFFFF;
  // node
  temp = this.node;
  for (i = 15; i >= 10; --i){
    this.bytes[i] = temp & 0xFFFF;
    temp = temp >>> 8;
  }
};
UUID._epoch = (new Date(1582, 9, 15)).valueOf();
UUID._last_unix_timestamp = 0;
UUID._ticks_per_ms = 1000;
UUID._last_unix_timestamp_tick = 0;
// Object.defineProperty(UUID, 'browserNode', {
//   configurable: true,
//   get: function(){
//     var parts = [
//       navigator.userAgent,
//     ];
//     var i, l;
//     for (i = 0, l = navigator.mimeTypes.length; i < l; ++i){
//       parts.push(navigator.mimeTypes[i].type);
//     }
//     for (i = 0, l = navigator.plugins.length; i < l; ++i){
//       parts.push(navigator.plugins[i].name);
//     }
//     Object.defineProperty(UUID, 'node', {
//       value: _node
//     });
//     return UUID.node;
//   }
// });
// UUID.nodeFromIdentifierStrings = function(identifiers){
//   var hash = new MD5(identifiers.join(':'));
//   var _node = 0;
//   for (var  i = 0; i < 6; ++i){
//     _node |= hash.bytes[Math.floor(Math.random() * hash.bytes.length)];
//     _node = _node << 8;
//   }
//   _node |= 0x10000000000;
//   return _node;
// };
UUID.prototype = Object.create({}, {
  string: {
    configurable: true,
    get: function(){
      var str = this.bytes.hexStringRepresentation();
      str = [str.substr(0, 8), str.substr(8, 4), str.substr(12, 4), str.substr(16, 4), str.substr(20, 12)].join('-');
      Object.defineProperty(this, 'string', {
        value: str
      });
      return this.string;
    }
  }
});