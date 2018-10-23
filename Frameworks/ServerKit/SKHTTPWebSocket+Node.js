// #import "ServerKit/SKHTTPWebSocket.js"
/* global SKHTTPWebSocket, JSData, JSLog */
'use strict';

var logger = JSLog("server", "websocket");

SKHTTPWebSocket.definePropertiesFromExtensions({

    _nodeSocket: null,

    initWithNodeSocket: function(nodeSocket){
        this.init();
        this._nodeSocket = nodeSocket;
        this._setupEventListeners();
    },

    _write: function(bytes){
        logger.info("Sending: %{public}", bytes.hexStringRepresentation());
        this._nodeSocket.write(bytes);
    },

    cleanup: function(){
        this._cleanupEventListeners();
        this._nodeSocket.destroy();
    },

    _setupEventListeners: function(){
        logger.info("listening for data");
        this._dataListener = this._handleDataEvent.bind(this);
        this._nodeSocket.addListener('data', this._dataListener);
    },

    _cleanupEventListeners: function(){
        if (this._dataListener !== null){
            logger.info("un-listening for data");
            this._nodeSocket.removeListener('data', this._dataListener);
        }
    },

    _handleDataEvent: function(bytes){
        this._receive(JSData.initWithBytes(bytes));
    }

});

SKHTTPWebSocket.defineInitMethod("initWithNodeSocket");