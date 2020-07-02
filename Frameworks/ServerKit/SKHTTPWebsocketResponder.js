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
'use strict';

(function(){

var logger = JSLog("serverkit", "websocket");

JSClass('SKHTTPWebsocketResponder', SKHTTPResponder, {

    _socket: null,
    protocols: null,

    websocket: function(){
        logger.info("calling websocket responder");
        this._socket = this.acceptWebsocketUpgrade(this.protocols);
        if (this._socket !== null){
            logger.info("got a socket");
            this._socket.delegate = this;
            this.websocketEstablished(this._socket);
        }else{
            logger.error("socket is null!");
        }
    },

    websocketEstablished: function(socket){
    },

    socketDidReceiveMessage: function(socket, chunks){
    },

    socketDidClose: function(socket){
    }

});

})();