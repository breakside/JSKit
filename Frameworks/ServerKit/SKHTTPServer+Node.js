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
var https = require('https');
var os = require('os');
var fs = require('fs');
var logger = JSLog("serverkit", "http");

SKHTTPServer.definePropertiesFromExtensions({

    _nodeHttpServer: null,

    run: function(){
        var scheme = "http";
        if (this.tlsCertificate && this.tlsPrivateKey){
            scheme = "https";
            var options = {
                cert: this.tlsCertificate,
                key: this.tlsPrivateKey
            };
            this._nodeHttpServer = https.createServer(options, this._handleNodeRequest.bind(this));
        }else{
            this._nodeHttpServer = http.createServer(this._handleNodeRequest.bind(this));
        }
        this._nodeHttpServer.listen(this.port);
        var networkInterfaces = os.networkInterfaces();
        var networkInterface;
        var address;
        for (var name in networkInterfaces){
            networkInterface = networkInterfaces[name];
            for (var i = 0, l = networkInterface.length; i < l; ++i){
                address = networkInterface[i];
                if (address.family == 'IPv4'){
                    logger.info("HTTP server listening on %{public}://%{public}:%d", scheme, address.address, this.port);
                }
            }
        }
    },

    stop: function(completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        if (this._nodeHttpServer === null){
            completion.call(target);
        }else{
            logger.info("HTTP server closing, waiting for outstanding requests to close");
            this.isStopping = true;
            this._websocketClosePromises = [];
            this.notificationCenter.post("SKHTTPServerWillStop", this);
            var server = this;
            this._nodeHttpServer.close(function(){
                logger.info("HTTP server closed");
                if (server._websocketClosePromises.length > 0){
                    logger.info("waiting for websocket delegates to complete");
                    Promise.all(server._websocketClosePromises).then(function(){
                        completion.call(target);
                    });
                }else{
                    completion.call(target);
                }
            });
        }
        return completion.promise;
    },

    _handleNodeRequest: function(nodeRequest, nodeResponse){
        try{
            var request = SKNodeHTTPRequest.initWithNodeRequest(nodeRequest, nodeResponse);
            if (this.tlsCertificate && this.tlsPrivateKey){
                request.url.scheme = "https";
            }
            this.handleRequest(request);
        }catch (e){
            nodeRequest.socket.destroy();
            logger.error(e);
        }
    },

    _handleNodeUpgrade: function(nodeRequest, socket, headPacket){
        try{
            var request = SKNodeHTTPRequest.initWithNodeRequest(nodeRequest, null);
            this.handleUpgrade(request);
        }catch(e){
            nodeRequest.socket.destroy();
            logger.error(e);
        }
    }

});