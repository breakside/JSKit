// #import "Foundation/Foundation.js"
// #import "ServerKit/SKHTTPHeaders.js"
/* global JSClass, JSObject, JSCustomProperty, JSDynamicProperty, JSReadOnlyProperty, JSURLResponse, SKHTTPResponse, SKHTTPHeaders */
'use strict';

var HTTPHeaderProperty = function(headerName, valueType){
    if (this === undefined){
        return new HTTPHeaderProperty(headerName, valueType);
    }
    this.headerName = headerName;
    this.valueType = valueType || HTTPHeaderValueType.text;
};

HTTPHeaderProperty.prototype = Object.create(JSCustomProperty.prototype);

HTTPHeaderProperty.prototype.define = function(C, publicKey, extensions){
    var setterName = this.setterName || C.nameOfSetMethodForKey(publicKey);
    var getterName = this.getterName || C.nameOfGetMethodForKey(publicKey);
    var headerName = this.headerName;
    var valueType = this.valueType;
    Object.defineProperty(C.prototype, getterName, {
        configurable: true,
        enumerable: false,
        value: function HTTPHeaderProperty_get(){
            var value = this.getHeader(headerName);
            if (value !== null){
                switch (valueType){
                    case HTTPHeaderValueType.integer:
                        value = parseInt(value);
                }
            }
            return value;
        }
    });
    Object.defineProperty(C.prototype, setterName, {
        configurable: true,
        enumerable: false,
        value: function HTTPHeaderProperty_set(value){
            this.setHeader(headerName, value);
        }
    });
    var getter = C.prototype[getterName];
    var setter = C.prototype[setterName];
    Object.defineProperty(C.prototype, publicKey, {
        configurable: true,
        enumerable: false,
        get: getter,
        set: setter
    });
};

var HTTPHeaderValueType = {
    text: 0,
    integer: 1
};

JSClass("SKHTTPResponse", JSObject, {

    statusCode: JSDynamicProperty('_statusCode', 200),
    contentType: HTTPHeaderProperty(SKHTTPHeaders.contentType),
    contentLength: HTTPHeaderProperty(SKHTTPHeaders.contentLength, HTTPHeaderValueType.integer),

    setHeader: function(name, value){
    },

    getHeader: function(name){
    },

    complete: function(){
    },

    sendFile: function(filePath){
    }

});

SKHTTPResponse.StatusCode = JSURLResponse.StatusCode;
SKHTTPResponse.Header = SKHTTPHeaders;