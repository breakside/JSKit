// Copyright 2020 Breakside Inc.
//
// Licensed under the Breakside Public License, Version 1.0 (the "License");
// you may not use this file except in compliance with the License.
// If a copy of the License was not distributed with this file, you may
// obtain a copy at
//
//     http://breakside.io/licenses/LICENSE-1.0.txt
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

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
            var value = this.headerMap.get(headerName);
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
            this.headerMap.set(headerName, value);
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

    statusCode: JSDynamicProperty('_statusCode', JSURLResponse.StatusCode.ok),
    contentType: HTTPHeaderProperty(SKHTTPHeaders.contentType),
    contentLength: HTTPHeaderProperty(SKHTTPHeaders.contentLength, HTTPHeaderValueType.integer),
    etag: HTTPHeaderProperty(SKHTTPHeaders.etag, HTTPHeaderValueType.quoted),
    lastModified: HTTPHeaderProperty(SKHTTPHeaders.lastModified, HTTPHeaderValueType.date),
    headerMap: JSReadOnlyProperty('_headerMap', null),
    tag: null,
    loggingEnabled: true,
    _needsHeaderWrite: true,

    init: function(){
        this._headerMap = JSMIMEHeaderMap();
    },

    setHeader: function(name, value){
        this._headerMap.set(name, value);
    },

    getHeader: function(name){
        return this._headerMap.get(name);
    },

    complete: function(){
    },

    writeHeader: function(){
    },

    writeHeaderIfNeeded: function(){
        if (this._needsHeaderWrite){
            this._needsHeaderWrite = false;
            this.writeHeader();
        }
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