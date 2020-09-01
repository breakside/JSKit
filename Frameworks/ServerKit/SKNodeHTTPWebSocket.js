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

// #import "SKHTTPWebSocket.js"
// jshint node: true
'use strict';

var logger = JSLog("serverkit", "websocket");

JSClass("SKNodeHTTPWebSocket", SKHTTPWebSocket, {

    _nodeSocket: null,

    initWithNodeSocket: function(nodeSocket, tag){
        this.init();
        this.tag = tag;
        this._nodeSocket = nodeSocket;
        this._setupEventListeners();
    },

    _write: function(data){
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
        logger.info("%{public} websocket listening for data", this.tag);
        this._dataListener = this._handleDataEvent.bind(this);
        this._closeListener = this._handleCloseEvent.bind(this);
        this._nodeSocket.addListener('data', this._dataListener);
        this._nodeSocket.addListener('close', this._closeListener);
    },

    _cleanupEventListeners: function(){
        if (this._dataListener !== null){
            logger.info("%{public} websocket un-listening for data", this.tag);
            this._nodeSocket.removeListener('data', this._dataListener);
        }
        if (this._closeListener !== null){
            this._nodeSocket.removeListener('close', this._closeListener);
        }
    },

    _handleDataEvent: function(buffer){
        try{
            this._receive(JSData.initWithNodeBuffer(buffer));
        }catch (e){
            logger.error(e);
        }
    },

    _handleCloseEvent: function(){
        this.cleanup();
    }

});