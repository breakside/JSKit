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

    _cleanup: function(){
        this._cleanupEventListeners();
        if (this._nodeSocket !== null){
            var socket = this._nodeSocket;
            this._nodeSocket = null;
            socket.destroy();
        }
    },

    _setupEventListeners: function(){
        logger.info("listening for data");
        this._dataListener = this._handleDataEvent.bind(this);
        this._closeListener = this._handleCloseEvent.bind(this);
        this._nodeSocket.addListener('data', this._dataListener);
        this._nodeSocket.addListener('close', this._closeListener);
    },

    _cleanupEventListeners: function(){
        if (this._dataListener !== null){
            logger.info("un-listening for data");
            this._nodeSocket.removeListener('data', this._dataListener);
        }
        if (this._closeListener !== null){
            this._nodeSocket.removeListener('close', this._closeListener);
        }
    },

    _handleDataEvent: function(bytes){
        this._receive(JSData.initWithBytes(bytes));
    },

    _handleCloseEvent: function(){
        this.cleanup();
    }

});

SKHTTPWebSocket.defineInitMethod("initWithNodeSocket");