// #import "ServerKit/SKHTTPResponder.js"
/* global JSClass, SKHTTPResponder, jslog_create */
'use strict';

(function(){

var logger = jslog_create("http.server");

JSClass('SKHTTPWebsocketResponder', SKHTTPResponder, {

    _socket: null,
    _protocols: null,

    websocket: function(){
        logger.info("calling websocket responder");
        this._socket = this.acceptWebSocketUpgrade(this._protocols);
        if (this._socket !== null){
            this._socket.delegate = this;
            this.websocketEstablished(this._socket);
        }
    },

    websocketEstablished: function(socket){
    },

    socketDidReceiveMessage: function(socket, chunks){
    }

});

})();