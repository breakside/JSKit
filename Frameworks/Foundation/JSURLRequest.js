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

// #import "JSObject.js"
// #import "JSURL.js"
// #import "JSMIMEHeaderMap.js"
// #import "JSMediaType.js"
'use strict';

JSClass("JSURLRequest", JSObject, {

    url: JSReadOnlyProperty('_url', null),
    method: JSDynamicProperty('_method', 'GET'),
    data: JSDynamicProperty('_data', null),
    response: JSReadOnlyProperty('_response', null),
    headers: JSReadOnlyProperty(),
    headerMap: JSDynamicProperty('_headerMap', null),
    object: JSDynamicProperty(),
    form: JSDynamicProperty(),
    contentType: JSDynamicProperty(),

    initWithURL: function(url){
        if (typeof(url) == "string"){
            url = JSURL.initWithString(url);
        }
        this._url = url;
        this._headerMap = JSMIMEHeaderMap();
    },

    getHeaders: function(){
        return this._headerMap.headers;
    },

    redirectedRequestToURL: function(url){
        var request = JSURLRequest.initWithURL(url);
        request._method = this._method;
        request._headerMap = this._headerMap;
        request._data = this._data;
        return request;
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
    },

    getForm: function(){
        var contentType = this.contentType;
        if (contentType === null){
            return null;
        }
        if (contentType.mime != 'application/x-www-form-urlencoded'){
            return null;
        }
        if (this._data === null){
            return null;
        }
        try{
            var form = JSFormFieldMap();
            form.decode(this._data, true);
            return form;
        }catch (e){
            return null;
        }
    },

    setForm: function(form){
        this.data = form.urlEncoded();
        this.contentType = JSMediaType('application/x-www-form-urlencoded');
    },

    setContentType: function(mediaType){
        this._headerMap.set('Content-Type', mediaType.toString());
    },

    getContentType: function(mediaType){
        var header = this._headerMap.get('Content-Type');
        if (!header){
            return null;
        }
        return JSMediaType(header);
    },

    addBasicAuthorization: function(username, password){
        var combined = username + ":" + password;
        var encoded = combined.utf8().base64StringRepresentation();
        this.headerMap.add("Authorization", "Basic " + encoded);
    },

    addBearerAuthorization: function(token){
        this.headerMap.add("Authorization", "Bearer " + token);
    }

});

JSURLRequest.Method = {
    'get': "GET",
    'put': "PUT",
    'delete': "DELETE",
    'post': "POST"
};

// deprecated
JSURLRequest.Method.GET = JSURLRequest.Method.get;
JSURLRequest.Method.PUT = JSURLRequest.Method.put;
JSURLRequest.Method.DELETE = JSURLRequest.Method.delete;
JSURLRequest.Method.POST = JSURLRequest.Method.post;