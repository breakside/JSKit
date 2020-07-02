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

// #import "SKHTTPServer.js"
// #import "SKNodeHTTPRequest.js"
// jshint node: true
'use strict';

var http = require('http');
var logger = JSLog("serverkit", "http");

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
        var request = SKNodeHTTPRequest.initWithNodeRequest(nodeRequest, nodeResponse);
        this.handleRequest(request);
    },

    _handleNodeUpgrade: function(nodeRequest, socket, headPacket){
        var request = SKNodeHTTPRequest.initWithNodeRequest(nodeRequest, null);
        this.handleUpgrade(request);
    }

});