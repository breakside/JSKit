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
// #import "JSMIMEHeaderMap.js"
// #import "JSMediaType.js"
'use strict';

JSClass("JSURLResponse", JSObject, {

    headerMap: JSReadOnlyProperty('_headerMap', null),
    contentType: JSLazyInitProperty('_getContentType', null),

    statusCode: -1,
    statusClass: JSDynamicProperty(),
    statusText: null,
    data: null,

    init: function(){
        this._headerMap = JSMIMEHeaderMap();
    },

    getStatusClass: function(){
        return this.statusCode === JSURLResponse.StatusCode.unknown ? JSURLResponse.StatusClass.unknown : Math.floor(this.statusCode / 100);
    },

    _getContentType: function(){
        var header = this._headerMap.get('Content-Type');
        if (!header){
            return null;
        }
        return JSMediaType(header);
    },

    object: JSLazyInitProperty('_getObject'),
    jsonMime: "application/json",

    _getObject: function(){
        if (this.data === null){
            return null;
        }
        if (!this.contentType){
            return null;
        }
        if (this.contentType.mime != this.jsonMime){
            return null;
        }
        if (this.contentType.parameters.charset !== undefined && this.contentType.parameters.charset != String.Encoding.utf8){
            return null;
        }
        var json = String.initWithData(this.data, String.Encoding.utf8);
        try{
            return JSON.parse(json);
        }catch (e){
            return null;
        }
    },
    
    headers: JSReadOnlyProperty(),

    getHeaders: function(){
        return this._headerMap.headers;
    },

});

JSURLResponse.StatusCode = {
    unknown: -1,
    noResponse: 0,
    continue: 100,
    switchingProtocols: 101,
    ok: 200,
    created: 201,
    accepted: 202,
    nonAuthorativeInformation: 203,
    noContent: 204,
    resetContent: 205,
    partialContent: 206,
    multipleChoices: 300,
    movedPermanently: 301,
    found: 302,
    seeOther: 303,
    notModified: 304,
    useProxy: 305,
    temporaryRedirect: 306,
    badRequest: 400,
    unauthorized: 401,
    paymentRequired: 402,
    forbidden: 403,
    notFound: 404,
    methodNotAllowed: 405,
    notAcceptable: 406,
    proxyAuthenticationRequired: 407,
    requestTimeout: 408,
    conflict: 409,
    gone: 410,
    lengthRequired: 411,
    preconditionFailed: 412,
    payloadTooLarge: 413,
    uriTooLong: 414,
    unsupportedMediaType: 415,
    rangeNotSatisfiable: 416,
    expectationFailed: 417,
    upgradeRequired: 426,
    preconditionRequired: 428,
    tooManyRequests: 429,
    requestHeaderFieldsTooLarge: 431,
    unavailableForLegalReasons: 451,
    internalServerError: 500,
    notImplemented: 501,
    badGateway: 502,
    serviceUnavailable: 503,
    gatewayTimeout: 504,
    httpVersionNotSupported: 505
};

JSURLResponse.StatusClass = {
    unknown: -1,
    noResponse: 0,
    informational: 1,
    success: 2,
    redirect: 3,
    clientError: 4,
    serverError: 5
};