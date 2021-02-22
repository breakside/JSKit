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
// #import "APIHeaders.js"
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
            var value = this.headerMap.get(headerName, null);
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
                    case HTTPHeaderValueType.mediaType:
                        value = JSMediaType(value);
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
                case HTTPHeaderValueType.mediaType:
                    value = value.toString();
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
    quoted: 3,
    mediaType: 4
};

JSClass("APIResponse", JSObject, {

    statusCode: JSDynamicProperty('_statusCode', JSURLResponse.StatusCode.ok),
    contentType: HTTPHeaderProperty(APIHeaders.contentType),
    contentLength: HTTPHeaderProperty(APIHeaders.contentLength, HTTPHeaderValueType.integer),
    etag: HTTPHeaderProperty(APIHeaders.etag, HTTPHeaderValueType.quoted),
    lastModified: HTTPHeaderProperty(APIHeaders.lastModified, HTTPHeaderValueType.date),
    headerMap: JSReadOnlyProperty('_headerMap', null),
    data: JSDynamicProperty('_data', null),
    object: JSDynamicProperty(),

    init: function(){
        this._headerMap = JSMIMEHeaderMap();
    },

    setHeader: function(name, value){
        this._headerMap.set(name, value);
    },

    getHeader: function(name){
        return this._headerMap.get(name);
    },

    getObject: function(){
        var contentType = this.contentType;
        if (contentType === null){
            return null;
        }
        if (contentType.mime != 'application/json'){
            return null;
        }
        if (this._data === null){
            return null;
        }
        try{
            var json = this._data.stringByDecodingUTF8();
            return JSON.parse(json);
        }catch (e){
            return null;
        }
    },

    setObject: function(object){
        var json = JSON.stringify(object);
        this.data = json.utf8();
        this.contentType = JSMediaType('application/json', {charset: 'utf-8'});
    }

});

APIResponse.StatusCode = JSURLResponse.StatusCode;
APIResponse.Header = APIHeaders;