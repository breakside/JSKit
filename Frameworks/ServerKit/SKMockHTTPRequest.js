// #import "SKHTTPRequest.js"
'use strict';

JSClass("SKMockHTTPRequest", SKHTTPRequest, {

    data: null,

    initWithURLRequest: function(urlRequest){
        SKMockHTTPRequest.$super.initWithMethodAndURL.call(this, urlRequest.method, urlRequest.url);
        this.data = urlRequest.data;
        this._headerMap = JSMIMEHeaderMap(urlRequest.headerMap);
        // TODO: this._response
    },

    getData: function(completion, target){
        if (!completion){
            completion = Promise.completion;
        }
        JSRunLoop.main.schedule(completion, target, this.data);
        return completion.promise;
    },

    _write: function(){
        
    }

});