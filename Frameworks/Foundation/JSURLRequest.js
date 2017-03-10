// #import "Foundation/JSObject.js"
// #import "Foundation/JSURL.js"
// #import "Foundation/JSMIMEHeaderMap.js"
/* global JSClass, JSObject, JSURL, JSReadOnlyProperty, JSMIMEHeaderMap, JSDynamicProperty, JSURLRequest */
'use strict';

JSClass("JSURLRequest", JSObject, {

    url: JSReadOnlyProperty('_url', null),
    method: JSDynamicProperty('_method', 'GET'),
    data: JSDynamicProperty('_data', null),
    response: JSReadOnlyProperty('_response', null),
    headers: JSReadOnlyProperty(),
    _headerMap: null,

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
    }

});

JSURLRequest.Method = {
    GET: "GET",
    PUT: "PUT",
    DELETE: "DELETE",
    POST: "POST"
};