// #import ServerKit
'use strict';

JSClass("MockServer", SKHTTPServer, {

});

JSClass("MockRequest", SKHTTPRequest, {

    _data: null,
    responseText: null,

    initMock: function(method, url, headers, data){
        this._method = method;
        this._url = url;
        this._headerMap = JSMIMEHeaderMap();
        this._headerMap.parse(headers.join("\r\n"));
        this._data = data;
        this._response = MockResponse.init();
        this.responseText = "";
    },

    getData: function(completion, target){
        JSRunLoop.main.schedule(completion, target, this._data);
    }

});

JSClass("MockResponse", SKHTTPResponse, {

    chunks: null,
    _headerMap: null,
    _headersWritten: false,

    init: function(){
        this.chunks = [];
        this._headerMap = JSMIMEHeaderMap();
    },

    complete: function(){
        this.writeHeaderIfNeeded();
    },

    writeHeader: function(){
        this.chunks.push("HTTP/1.1 %d\r\n".sprintf(this._statusCode).utf8());
        var header;
        for (var i = 0, l = this._headerMap.headers.length; i < l; ++i){
            header = this._headerMap.headers[i];
            this.chunks.push("%s\r\n".sprintf(header).utf8());
        }
        this.chunks.push("\r\n".utf8());
    },

    writeData: function(chunk){
        this.writeHeaderIfNeeded();
        this.chunks.push(chunk);
    },

    text: JSReadOnlyProperty(),

    getText: function(){
        var data = JSData.initWithChunks(this.chunks);
        return data.stringByDecodingUTF8();
    },

    isClosed: false,

    close: function(){
        this.isClosed = true;
    }

});