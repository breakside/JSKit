// #import "ServerKit/SKHTTPWebSocket.js"
/* global SKHTTPWebSocket, JSData, jslog_create */
'use strict';

var logger = jslog_create('http.server');

SKHTTPWebSocket.definePropertiesFromExtensions({

    _nodeSocket: null,

    initWithNodeSocket: function(nodeSocket){
        this.init();
        this._nodeSocket = nodeSocket;
        this._setupEventListeners();
    },

    _write: function(bytes){
        logger.info("Sending: %s", bytes.hexStringRepresentation());
        this._nodeSocket.write(bytes);
    },

    cleanup: function(){
        this._cleanupEventListeners();
        this._nodeSocket.destroy();
    },

    _setupEventListeners: function(){
        this._dataListener = this._handleDataEvent.bind(this);
        this._nodeSocket.addListener('data', this._dataListener);
    },

    _cleanupEventListeners: function(){
        if (this._dataListener !== null){
            this._nodeSocket.removeListener('data', this._dataListener);
        }
    },

    _handleDataEvent: function(bytes){
        this._receive(JSData.initWithBytes(bytes));
    }

});