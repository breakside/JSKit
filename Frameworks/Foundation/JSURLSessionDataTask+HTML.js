// #import "Foundation/JSURL.js"
// #import "Foundation/JSURLSessionDataTask.js"
// #import "Foundation/JSURLRequest.js"
// #import "Foundation/JSURLResponse.js"
// #import "Foundation/JSRunLoop.js"
// #feature XMLHttpRequest
/* global JSClass, JSURLSessionDataTask, JSRunLoop, JSLazyInitProperty, XMLHttpRequest, jslog_create, JSURLResponse, JSURLRequest, JSURL, setTimeout, JSData */
'use strict';

(function(){

var logger = jslog_create("foundation.url-session");

JSURLSessionDataTask.definePropertiesFromExtensions({

    _xmlRequest: JSLazyInitProperty('_createXMLRequest'),

    resume: function(){
        var request = this._currentRequest;
        var data = null;
        var url = request.url.encodedString;
        if (request.data !== null){
            data = request.data.bytes;
        }
        if (this._xmlRequest.readyState === XMLHttpRequest.UNSENT){
            try {
                this._xmlRequest.open('GET', url, true);
            }catch (e){
                this._error = e;
                logger.error("error opening request: %s".sprintf(e.message));
            }
        }
        if (this._xmlRequest.readyState !== XMLHttpRequest.UNSENT){
            this._xmlRequest.send(data);
        }else{
            JSRunLoop.main.schedule(this._complete, this);
        }
    },

    cancel: function(){
        this._xmlRequest.abort();
    },

    _createXMLRequest: function(){
        var request = this._currentRequest;
        var xmlRequest = new XMLHttpRequest();
        xmlRequest.responseType = "arraybuffer";
        var headers = request.headers;
        var header;
        for (var i = 0, l = headers.length; i < l; ++i){
            header = headers[i];
            xmlRequest.setRequestHeader(header.name, header.value);
        }
        this._addEventListeners(xmlRequest);
        return xmlRequest;
    },

    _addEventListeners: function(xmlRequest){
        xmlRequest.addEventListener('loadstart', this);
        xmlRequest.addEventListener('progress', this);
        xmlRequest.addEventListener('abort', this);
        xmlRequest.addEventListener('error', this);
        xmlRequest.addEventListener('load', this);
        xmlRequest.addEventListener('timeout', this);
        xmlRequest.addEventListener('loadend', this);
        xmlRequest.addEventListener('readystatechange', this);
        xmlRequest.upload.addEventListener('loadstart', this);
        xmlRequest.upload.addEventListener('progress', this);
        xmlRequest.upload.addEventListener('abort', this);
        xmlRequest.upload.addEventListener('error', this);
        xmlRequest.upload.addEventListener('load', this);
        xmlRequest.upload.addEventListener('timeout', this);
        xmlRequest.upload.addEventListener('loadend', this);
        xmlRequest.upload.addEventListener('readystatechange', this);
    },

    _removeEventListeners: function(xmlRequest){
        xmlRequest.removeEventListener('loadstart', this);
        xmlRequest.removeEventListener('progress', this);
        xmlRequest.removeEventListener('abort', this);
        xmlRequest.removeEventListener('error', this);
        xmlRequest.removeEventListener('load', this);
        xmlRequest.removeEventListener('timeout', this);
        xmlRequest.removeEventListener('loadend', this);
        xmlRequest.removeEventListener('readystatechange', this);
        xmlRequest.upload.removeEventListener('loadstart', this);
        xmlRequest.upload.removeEventListener('progress', this);
        xmlRequest.upload.removeEventListener('abort', this);
        xmlRequest.upload.removeEventListener('error', this);
        xmlRequest.upload.removeEventListener('load', this);
        xmlRequest.upload.removeEventListener('timeout', this);
        xmlRequest.upload.removeEventListener('loadend', this);
        xmlRequest.upload.removeEventListener('readystatechange', this);
    },

    _initializeResponse: function(){
        var url = JSURL.initWithString(this._xmlRequest.responseURL);
        if (!url.isEqualToURL(this._currentRequest.url)){
            this._currentRequest = this._originalRequest.redirectedRequestToURL(url);
        }
        var response = JSURLResponse.init();
        response.statusCode = this._xmlRequest.status;
        response._headerMap.parse(this._xmlRequest.getAllResponseHeaders());
        response.statusText = this._xmlRequest.statusText;
        this._currentRequest._response = response;
    },

    _finalizeResponse: function(){
        var bytes = new Uint8Array(this._xmlRequest.response);
        this._currentRequest._response.data = JSData.initWithBytes(bytes);
    },

    _complete: function(){
        this._removeEventListeners(this._xmlRequest);
        if (this._error === null && this._xmlRequest.status === 0){
            // TODO: formalize errors
            this._error = "network error";
        }
        if (this._error === null){
            this._finalizeResponse();
        }
        this.session._taskDidComplete(this, this._error);
    },

    handleEvent: function(e){
        if (e.currentTarget === this._xmlRequest){
            this['_event_' + e.type](e);
        }else if (e.currentTarget === this._xmlRequest.upload){
            this['_upload_event_' + e.type](e);
        }
    },

    _event_loadstart: function(e){
        // logger.info("%s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
    },

    _event_progress: function(e){
        // logger.info("%s, state=%d; %d/%d".sprintf(e.type, this._xmlRequest.readyState, e.loaded, e.lengthComputable ? e.total : 0));
        this.session._taskDidReceiveBodyData(this, e.loaded, e.lengthComputable ? e.total : undefined);
    },

    _event_abort: function(e){
        // logger.info("%s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
        // TODO: formalize errors
        this._error = "abort";
    },

    _event_error: function(e){
        // logger.info("%s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
        // TODO: formalize errors
        this._error = "error";
    },

    _event_load: function(e){
        // logger.info("%s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
    },

    _event_timeout: function(e){
        // logger.info("%s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
        // TODO: formalize errors
        this._error = "timeout";
    },

    _event_loadend: function(e){
        // logger.info("%s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
        this._complete();
    },

    _event_readystatechange: function(e){
        // logger.info("%s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
        switch (this._xmlRequest.readyState){
            case XMLHttpRequest.UNSENT:
                break;
            case XMLHttpRequest.OPENED:
                break;
            case XMLHttpRequest.HEADERS_RECEIVED:
                this._initializeResponse();
                break;
            case XMLHttpRequest.LOADING:
                break;
            case XMLHttpRequest.DONE:
                break;
        }
    },

    _upload_event_loadstart: function(e){
        // logger.info("upload %s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
    },

    _upload_event_progress: function(e){
        // logger.info("upload %s, state=%d; %d/%d".sprintf(e.type, this._xmlRequest.readyState), e.loaded, e.lengthComputable ? e.total : 0);
        this.session._taskDidSendBodyData(this, e.loaded, e.lengthComputable ? e.total : undefined);
    },

    _upload_event_abort: function(e){
        // logger.info("upload %s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
        // TODO: formalize errors
        this._error = "upload abort";
    },

    _upload_event_error: function(e){
        // logger.info("upload %s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
        // TODO: formalize errors
        this._error = "upload error";
    },

    _upload_event_load: function(e){
        // logger.info("upload %s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
    },

    _upload_event_timeout: function(e){
        // logger.info("upload %s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
        // TODO: formalize errors
        this._error = "upload timeout";
    },

    _upload_event_loadend: function(e){
        // logger.info("upload %s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
    },

    _upload_event_readystatechange: function(e){
        // logger.info("upload %s, state=%d".sprintf(e.type, this._xmlRequest.readyState));
        switch (this._xmlRequest.readyState){
            case XMLHttpRequest.UNSENT:
                break;
            case XMLHttpRequest.OPENED:
                break;
            case XMLHttpRequest.HEADERS_RECEIVED:
                break;
            case XMLHttpRequest.LOADING:
                break;
            case XMLHttpRequest.DONE:
                break;
        }
    }
});

})();