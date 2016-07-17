'use strict';

var JSProtocol = {};

Object.defineProperty(JSProtocol, '$extend', {
  configurable: false,
  enumerable: false,
  value: function(extensions){
    var P = Object.create(this);
    for (var key in extensions){
      Object.defineProperty(P, key, {
        enumerable: true,
        configurable: true,
        writable: false,
        value: extensions[key]
      });
    }
    return P;
  }
});