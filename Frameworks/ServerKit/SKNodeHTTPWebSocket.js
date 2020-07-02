// #import "SKHTTPWebSocket.js"
// jshint node: true
'use strict';

var logger = JSLog("serverkit", "websocket");

JSClass("SKNodeHTTPWebSocket", SKHTTPWebSocket, {

    _nodeSocket: null,

    initWithNodeSocket: function(nodeSocket){
        this.init();
        this._nodeSocket = nodeSocket;
        this._setupEventListeners();
    },

    _write: function(data){
        logger.info("Sending: %{public}", data.hexStringRepresentation());
        this._nodeSocket.write(data.nodeBuffer());
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

    _handleDataEvent: function(buffer){
        this._receive(JSData.initWithNodeBuffer(buffer));
    },

    _handleCloseEvent: function(){
        this.cleanup();
    }

});