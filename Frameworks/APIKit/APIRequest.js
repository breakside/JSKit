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
// #import "APIResponse.js"
// #import "APIValidatingObject.js"
'use strict';

var logger = JSLog("api", "request");

JSClass("APIRequest", JSObject, {

    url: JSReadOnlyProperty("_url", null),
    headerMap: JSReadOnlyProperty("_headerMap", null),
    method: JSReadOnlyProperty("_method", null),
    contentType: JSLazyInitProperty("_getContentType"),
    origin: JSLazyInitProperty("_getOrigin"),
    _data: null,
    receivedAt: null,

    initWithMethodAndURL: function(method, url, headerMap){
        this._method = method;
        this._url = JSURL.initWithURL(url);
        this._headerMap = headerMap || JSMIMEHeaderMap();
        this.receivedAt = JSDate.now;
        var host = this._headerMap.get('Host', null);
        var scheme = this._headerMap.get('X-Forwarded-Proto', 'http');
        if (host !== null){
            this._url.host = host;
            this._url.scheme = scheme;
        }
    },

    _getContentType: function(){
        var header = this.headerMap.get('Content-Type');
        return JSMediaType(header);
    },

    _getOrigin: function(){
        return this.headerMap.get('Origin', null);
    },

    acceptContentTypes: JSLazyInitProperty(function(){
        var mediaStrings = this.headerMap.get("Accept", "").split(/\s*,\s*/);
        var contentTypesAndWeights = [];
        var contentType;
        var q;
        for (var i = 0, l = mediaStrings.length; i < l; ++i){
            contentType = JSMediaType(mediaStrings[i]);
            if (contentType !== null){
                q = 1;
                if (contentType.parameters.q !== undefined){
                    q = parseFloat(contentType.parameters.q);
                    if (isNaN(q)){
                        q = 0;
                    }
                    delete contentType.parameters.q;
                }
                contentTypesAndWeights.push([contentType, q]);
            }
        }
        contentTypesAndWeights.sort(function(a, b){
            var d = b[1] - a[1];
            if (d !== 0){
                return d;
            }
            if (a[0].type !== "*" && b[0].type === "*"){
                return -1;
            }
            if (a[0].type === "*" && b[0].type !== "*"){
                return 1;
            }
            if (a[0].subtype !== "*" && b[0].subtype === "*"){
                return -1;
            }
            if (a[0].subtype === "*" && b[0].subtype !== "*"){
                return 1;
            }
            d = Object.keys(b[0].parameters).length - Object.keys(a[0].parameters).length;
            return d;
        });
        return contentTypesAndWeights.map(function(pair){
            return pair[0];
        });
    }),

    needsEntityWithTag: function(etag){
        if (!etag){
            return true;
        }
        var tags = this.headerMap.get('If-None-Match', '').split(',');
        var tag;
        for (var i = 0, l = tags.length; i < l; ++i){
            tag = tags[i].trim();
            if (tag === '*'){
                return false;
            }
            if (tag.startsWith('"') && tag.endsWith('"')){
                tag = tag.substr(1, tag.length - 2).replace('\\"', '"');
            }
            if (tag == etag){
                return false;
            }
        }
        return true;
    },

    needsEntityModifiedAt: function(lastModified){
        var ifModifiedSince = this.headerMap.get('If-Modified-Since', null);
        if (ifModifiedSince){
            var cutoffNative = new Date(ifModifiedSince);
            var cutoffNativeTimestamp = cutoffNative.getTime();
            if (!isNaN(cutoffNativeTimestamp)){
                var cutoff = JSDate.initWithTimeIntervalSince1970(cutoffNativeTimestamp / 1000);
                if (cutoff.compare(lastModified) >= 0){
                    return false;
                }
            }
        }
        return true;
    },

    needsEntity: function(lastModified, etag){
        if (etag){
            return this.needsEntityWithTag(etag) && this.needsEntityModifiedAt(lastModified);
        }
        return this.needsEntityModifiedAt(lastModified);
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        completion.call(target, this._data);
        return completion.promise;
    },

    getObject: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (!this.contentType || this.contentType.mime !== 'application/json'){
            completion.call(target, null);
            return completion.promise;
        }
        if (this.contentType.parameters.charset && this.contentType.parameters.charset !== String.Encoding.utf8){
            completion.call(target, null);
            return completion.promise;
        }
        this.getData(function(data){
            if (data === null){
                completion.call(target, null);
                return;
            }
            var json = String.initWithData(data, String.Encoding.utf8);
            var obj = null;
            try{
                obj = JSON.parse(json);
            }catch (e){
            }
            completion.call(target, obj);
        }, this);
        return completion.promise;
    },

    getValidatingObject: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.getObject(function(obj){
            var validator = APIValidatingObject.initWithObject(obj);
            completion.call(target, validator);
        });
        return completion.promise;
    },

    getValidObject: function(validatingClass, completion, target){
        if (!completion){
            completion = Promise.completion(function(result){
                if (result[0] !== null){
                    return Promise.reject(result[0]);
                }
                return result[1];
            });
        }
        this.getValidatingObject(function(validator){
            var valid = null;
            var error = null;
            try{
                valid = validatingClass.initWithValidatingObject(validator);
            }catch (e){
                error = e;
            }
            completion.call(target, error, valid);
        });
        return completion.promise;

    },

    getForm: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (!this.contentType || this.contentType.mime !== 'application/x-www-form-urlencoded'){
            completion.call(target, null);
            return completion.promise;
        }
        this.getData(function(data){
            if (data === null){
                completion.call(target, null);
                return;
            }
            var form = JSFormFieldMap();
            form.decode(data, true);
            completion.call(target, form);
        }, this);
        return completion.promise;
    },

    getValidatingForm: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.getForm(function(form){
            var validator = APIValidatingObject.initWithForm(form);
            completion.call(target, validator);
        });
        return completion.promise;
    },

    getVaidForm: function(validatingClass, completion, target){
        if (!completion){
            completion = Promise.completion(function(result){
                if (result[0] !== null){
                    return Promise.reject(result[0]);
                }
                return result[1];
            });
        }
        this.getValidatingForm(function(validator){
            var valid = null;
            var error = null;
            try{
                valid = validatingClass.initWithValidatingObject(validator);
            }catch (e){
                error = e;
            }
            completion.call(target, error, valid);
        });
        return completion.promise;
    },

    getValidatingQuery: function(){
        return APIValidatingObject.initWithForm(this.url.query);
    },

    getValidQuery: function(validatingClass){
        var validator = this.getValidatingQuery();
        return validatingClass.initWithValidatingObject(validator);
    },

    bearerToken: JSReadOnlyProperty(),

    getBearerToken: function(){
        var authorization = this.headerMap.get("Authorization", null);
        if (authorization !== null){
            if (authorization.startsWith("Bearer ")){
                return authorization.substr(7);
            }
        }
        return null;
    },

    username: JSReadOnlyProperty(),

    getBasicAuthorization: function(){
        var authorization = this.headerMap.get("Authorization", null);
        if (authorization !== null){
            if (authorization.startsWith("Basic ")){
                try{
                    var basic = authorization.substr(6).dataByDecodingBase64().stringByDecodingUTF8();
                    return basic;
                }catch (e){
                    return null;
                }
            }
        }
        return null;
    },

    getUsername: function(){
        var basic = this.getBasicAuthorization();
        if (basic !== null){
            var index = basic.indexOf(":");
            if (index >= 0){
                return basic.substr(0, index);
            }
            return basic;
        }
        return null;
    },

    password: JSReadOnlyProperty(),

    getPassword: function(){
        var basic = this.getBasicAuthorization();
        if (basic !== null){
            var index = basic.indexOf(":");
            if (index >= 0){
                return basic.substr(index + 1);
            }
            return null;
        }
        return null;
    }

});