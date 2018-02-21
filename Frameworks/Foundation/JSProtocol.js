// #import "Foundation/Javascript.js"
/* global JSGlobalObject, JSProtocol */
'use strict';

JSGlobalObject.JSProtocol = function(name, superprotocol, extensions){
    if (this === undefined){
        if (superprotocol instanceof JSProtocol){
            JSGlobalObject[name] = superprotocol.$extend(extensions);
            return JSGlobalObject[name];
        }
    }
};

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