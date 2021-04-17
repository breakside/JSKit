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

// #import "SKHTTPResponder.js"
// #import "SKHTTPWebSocket.js"
'use strict';

(function(){

JSClass('SKHTTPWebSocketResponder', SKHTTPResponder, {

    _socket: null,
    supportedProtocols: null,
    protocol: null,

    objectMethodForRequestMethod: function(){
        return null;
    },

    objectMethodForUpgrade: function(upgrade){
        if (upgrade.lowercaseString() == 'websocket'){
            return this.websocket;
        }
        return null;
    },

    websocket: function(){
        this.request.logger.info("upgrading to websocket");
        var requestHeaders = this._request.headerMap;
        var version = requestHeaders.get('Sec-WebSocket-Version');
        if (version !== "13"){
            this.request.logger.warn("Unexpected websocket version: %{public}", version);
            throw new SKHTTPError(SKHTTPResponse.StatusCode.badRequest);
        }
        var requestedProtocols = requestHeaders.get('Sec-WebSocket-Protocol', '').trimmedSplit(',');
        var supportedProtocols = this.supportedProtocols;
        if (supportedProtocols === null){
            supportedProtocols = this.protocols; // fallback to deprectated name
        }
        this.protocol = findFirstMatch(supportedProtocols, requestedProtocols);
        if (this.protocol === null){
            this.request.logger.warn("No match for protocols: %{public}", requestedProtocols.join(", "));
            throw new SKHTTPError(SKHTTPResponse.StatusCode.badRequest);
        }

        this.response.statusCode = SKHTTPResponse.StatusCode.switchingProtocols;
        var key = requestHeaders.get('Sec-WebSocket-Key', '');
        var accept = JSSHA1Hash((key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11").utf8()).base64StringRepresentation();
        this.response.headerMap.set("Upgrade", "websocket");
        this.response.headerMap.set("Connection", "Upgrade");
        this.response.headerMap.set("Sec-WebSocket-Accept", accept);
        this.response.headerMap.set("Sec-WebSocket-Protocol", this.protocol);
        this.response.writeHeaderIfNeeded();

        this._socket = this._request.createWebsocket();
        if (this._socket === null){
            this.request.logger.error("failed to create websocket");
            this._request.close();
            return;
        }

        this._socket.delegate = this;
        this.startLisentingForNotifications();
        return this.websocketEstablished(this._socket);
    },

    notificationObservers: null,

    startLisentingForNotifications: function(){
        if (this.notificationObservers === null){
            this.notificationObservers = {
                serverWillStop: this.server.notificationCenter.addObserver("SKHTTPServerWillStop", this.server, this.serverWillStop, this)
            };
        }
    },

    stopListeningForNotifications: function(){
        if (this.notificationObservers !== null){
            this.server.notificationCenter.removeObserver("SKHTTPServerWillStop", this.notificationObservers.serverWillStop);
        }
    },

    serverWillStop: function(notification){
        if (this._socket !== null){
            this.logger.info("closing because server will stop");
            this._socket._close(SKHTTPWebSocket.Status.goingAway);
        }
    },

    fail: function(error){
        if (this._socket !== null){
            this._socket.close(SKHTTPWebSocket.Status.generic);
            return;
        }
        SKHTTPWebSocketResponder.$super.fail.call(this, error);
    },

    sendMessage: function(data){
        this._socket.sendMessage(data);
    },

    startMessage: function(data){
        this._socket.startMessage(data);
    },

    continueMessage: function(data, isFinal){
        this._socket.continueMessage(data, isFinal);
    },

    websocketEstablished: function(socket){
    },

    socketDidReceiveMessage: function(socket, chunks){
    },

    socketDidClose: function(socket){
    },

    // always called even if subclass overrides socketDidClose
    socketDidClosePrivate: function(socket){
        this._socket.delegate = null;
        this._socket = null;
        this.stopListeningForNotifications();
    }

});

var findFirstMatch = function(a, b){
    for (var i = 0, l = a.length; i < l; ++i){
        for (var j = 0, k = b.length; j < k; ++j){
            if (a[i] == b[j].trim()){
                return a[i];
            }
        }
    }
    return null;
};

})();