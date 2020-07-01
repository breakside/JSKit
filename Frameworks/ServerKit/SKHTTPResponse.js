// #import Foundation
// #import "SKHTTPHeaders.js"
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
                        break;
                    case HTTPHeaderValueType.date:
                        value = JSDate.initWithTimeIntervalSince1970(new Date(value).getTime() / 1000);
                        break;
                    case HTTPHeaderValueType.quoted:
                        if (value && value.startsWith('"') && value.endsWith('"')){
                            value = value.substr(1, value.length - 2).replace('\\"', '"');
                        }
                        break;
                }
            }
            return value;
        }
    });
    Object.defineProperty(C.prototype, setterName, {
        configurable: true,
        enumerable: false,
        value: function HTTPHeaderProperty_set(value){
            switch (valueType){
                case HTTPHeaderValueType.integer:
                    value = value.toString();
                    break;
                case HTTPHeaderValueType.date:
                    value = new Date(value.timeIntervalSince1970 * 1000).toUTCString();
                    break;
                case HTTPHeaderValueType.quoted:
                    value = '"' + value.replace('"', '\\"') + '"';
                    break;
            }
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
    integer: 1,
    date: 2,
    quoted: 3
};

JSClass("SKHTTPResponse", JSObject, {

    statusCode: JSDynamicProperty('_statusCode', -1),
    contentType: HTTPHeaderProperty(SKHTTPHeaders.contentType),
    contentLength: HTTPHeaderProperty(SKHTTPHeaders.contentLength, HTTPHeaderValueType.integer),
    etag: HTTPHeaderProperty(SKHTTPHeaders.etag, HTTPHeaderValueType.quoted),
    lastModified: HTTPHeaderProperty(SKHTTPHeaders.lastModified, HTTPHeaderValueType.date),

    setStatusCode: function(statusCode){
        this._setStatusCode(statusCode);
    },

    getStatusCode: function(){
        return this._getStatusCode();
    },

    setHeader: function(name, value){
    },

    getHeader: function(name){
    },

    complete: function(){
    },

    writeString: function(str){
        this.writeData(str.utf8());
    },

    writeData: function(data){
    },

    writeFile: function(filePath){
    }

});

SKHTTPResponse.StatusCode = JSURLResponse.StatusCode;
SKHTTPResponse.Header = SKHTTPHeaders;