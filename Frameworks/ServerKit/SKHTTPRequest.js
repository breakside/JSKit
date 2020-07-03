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
// #import "SKHTTPResponse.js"
// #import "SKValidatingObject.js"
'use strict';

var logger = JSLog("serverkit", "http");

JSClass("SKHTTPRequest", JSObject, {

    url: JSReadOnlyProperty('_url', null),
    response: JSReadOnlyProperty('_response', null),
    headerMap: JSReadOnlyProperty('_headerMap', null),
    method: JSReadOnlyProperty('_method', null),
    contentType: JSLazyInitProperty('_getContentType'),
    origin: JSLazyInitProperty('_getOrigin'),

    initWithMethodAndURL: function(method, url){
        this._method = method;
        this._url = url;
        this._headerMap = JSMIMEHeaderMap();
    },

    _getContentType: function(){
        var header = this.headerMap.get('Content-Type');
        return JSMediaType(header);
    },

    _getOrigin: function(){
        return this.headerMap.get('Origin', null);
    },

    respond: function(statusCode, statusMessage, headerMap){
        this._write("HTTP/1.1 %d %s\r\n".sprintf(statusCode, statusMessage));
        var header;
        for (var i = 0, l = headerMap.headers.length; i < l; ++i){
            header = headerMap.headers[i];
            this._write("%s\r\n".sprintf(header));
        }
        this._write("\r\n");
    },

    upgrade: function(statusMessage, headerMap){
        this.respond(SKHTTPResponse.StatusCode.switchingProtocols, statusMessage, headerMap);
    },

    writeRawHeaders: function(headers){
        this._write(headers.join("\r\n") + "\r\n\r\n");
    },

    createWebsocket: function(){
    },

    _write: function(){
    },

    close: function(){
    },

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
    },

    getObject: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (!this.contentType || this.contentType.mime !== 'application/json' || this.contentType.parameters.charset !== String.Encoding.utf8){
            completion.call(target, null);
            return completion.promise;
        }
        this.getData(function(data){
            if (data === null){
                completion.call(target, null);
                return;
            }
            var json = String.initWithData(data, this.contentType.parameters.charset);
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
            var validator = SKValidatingObject.initWithObject(obj);
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
            var encoded = String.initWithData(data, this.contentType.parameters.charset);
            var form = JSFormFieldMap();
            form.decode(encoded, true);
            completion.call(target, form);
        }, this);
        return completion.promise;
    },

    getValidatingForm: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.getForm(function(form){
            var validator = SKValidatingObject.initWithForm(form);
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
        return SKValidatingObject.initWithForm(this.url.query);
    },

    getValidQuery: function(validatingClass){
        var validator = this.getValidatingQuery();
        return validatingClass.initWithValidatingObject(validator);
    }

});