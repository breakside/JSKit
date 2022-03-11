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

// #import "JSURL.js"
// #import "JSURLResponse.js"
// #import "JSLog.js"
// #feature XMLHttpRequest
// jshint browser: true
'use strict';

(function(){

var logger = JSLog("foundation", "http-client");

JSClass("JSHTMLHTTPClient", JSObject, {

    send: function(request, callbacks, target){
        var completed = false;
        var complete = function(error){
            if (completed){
                return;
            }
            completed = true;
            if (callbacks.complete){
                callbacks.complete.call(target, error);
            }
        };
        var failEventHandler = function(e){
            if (e.type == "error"){
                complete(new Error("XMLHttpRequest error (network down, timeout, CORS, etc)"));
            }else if (e.type == "timeout"){
                complete(new Error("XMLHttpRequest timeout"));
            }else if (e.type == "abort"){
                complete(new Error("XMLHttpRequest aborted"));
            }else{
                complete(new Error("XMLHttpRequest failed with event: " + e.type));
            }
        };
        try {
            var response = null;
            var xmlRequest = new XMLHttpRequest();

            // Error Events
            xmlRequest.addEventListener('abort', failEventHandler);
            xmlRequest.addEventListener('timeout', failEventHandler);
            xmlRequest.addEventListener('error', failEventHandler);
            xmlRequest.upload.addEventListener('abort', failEventHandler);
            xmlRequest.upload.addEventListener('timeout', failEventHandler);
            xmlRequest.upload.addEventListener('error', failEventHandler);

            // Progress Events
            if (callbacks.progress){
                xmlRequest.addEventListener('progress', function(e){
                    callbacks.progress.call(target, e.loaded, e.lengthComputable ? e.total : undefined);
                });
            }
            if (callbacks.uploadProgress){
                xmlRequest.upload.addEventListener('progress', function(e){
                    callbacks.progress.call(target, e.loaded, e.lengthComputable ? e.total : undefined);
                });
            }

            // Loading Events
            xmlRequest.addEventListener('readystatechange', function(e){
                if (xmlRequest.readyState == XMLHttpRequest.HEADERS_RECEIVED){
                    var url = JSURL.initWithString(xmlRequest.responseURL);
                    if (!url.isEqual(request.url)){
                        if (callbacks.redirect){
                            callbacks.redirect.call(target, url);
                        }
                    }
                    response = JSURLResponse.init();
                    response.statusCode = xmlRequest.status;
                    response._headerMap.parse(xmlRequest.getAllResponseHeaders());
                    response.statusText = xmlRequest.statusText;
                    if (callbacks.response){
                        callbacks.response.call(target, response);
                    }
                }
            });
            xmlRequest.addEventListener('loadend', function(){
                if (completed){
                    return;
                }
                if (xmlRequest.status === 0){
                    complete(new Error("network"));
                    return;
                }
                if (response === null){
                    complete(new Error("no response"));
                    return;
                }
                try{
                    response.data = JSData.initWithBuffer(xmlRequest.response);
                }catch (e){
                    complete(e);
                    return;
                }
                complete(null);
            });

            // Request configuration
            xmlRequest.responseType = "arraybuffer";
            xmlRequest.open(request.method, request.url.encodedString, true);
            var headers = request.headers;
            var header;
            for (var i = 0, l = headers.length; i < l; ++i){
                header = headers[i];
                xmlRequest.setRequestHeader(header.name, header.value);
            }
            xmlRequest.send(request.data);
            return function(){
                if (completed){
                    return;
                }
                xmlRequest.abort();
            };
        }catch (e){
            logger.error("error opening request: %{public}", e.message);
            complete(e);
        }
        return null;
    }

});

Object.defineProperties(JSHTMLHTTPClient, {
    shared: {
        configurable: true,
        get: function(){
            var client = JSHTMLHTTPClient.init();
            Object.defineProperty(this, 'shared', {value: client});
            return client;
        }
    }
});

})();