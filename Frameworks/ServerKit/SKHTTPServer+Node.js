// #import "ServerKit/SKHTTPServer.js"
// #import "ServerKit/SKHTTPRequest+Node.js"
/* global SKHTTPServer, require, SKHTTPRequest, jslog_create */
'use strict';

var http = require('http');
var logger = jslog_create("http.server");

SKHTTPServer.definePropertiesFromExtensions({

    _nodeHttpServer: null,

    _extensionInit: function(port){
        this._nodeHttpServer = http.createServer(this._handleNodeRequest.bind(this));
        this._setupEventHandlers();
    },

    run: function(){
        this._nodeHttpServer.listen(this.port);
    },

    _setupEventHandlers: function(){
        this._nodeHttpServer.on('upgrade', this._handleNodeUpgrade.bind(this));
    },

    _handleNodeRequest: function(nodeRequest, nodeResponse){
        var request = SKHTTPRequest.initWithNodeRequest(nodeRequest, nodeResponse);
        this._handleRequest(request);
    },

    _handleNodeUpgrade: function(nodeRequest, socket, headPacket){
        var request = SKHTTPRequest.initWithNodeRequest(nodeRequest, null);
        this._handleUpgrade(request);
    }

});