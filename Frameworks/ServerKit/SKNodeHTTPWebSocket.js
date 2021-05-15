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

JSClass("SKNodeHTTPWebSocket", SKHTTPWebSocket, {

    _nodeSocket: null,

    initWithNodeSocket: function(nodeSocket, tag, logger){
        this.init();
        this.tag = tag;
        this.logger = logger;
        this._nodeSocket = nodeSocket;
        this._setupEventListeners();
    },

    _isWriting: false,
    _shouldDestroy: false,

    _write: function(data){
        if (this._sentClose){
            return;
        }
        var websocket = this;
        this._isWriting = true;
        this._nodeSocket.write(data.nodeBuffer(), function(){
            websocket._isWriting = false;
            if (websocket._shouldDestroy){
                websocket._cleanup();
            }
        });
    },

    _cleanup: function(){
        this._cleanupEventListeners();
        if (this._nodeSocket !== null){
            if (this._isWriting){
                this._shouldDestroy = true;
            }else{
                var socket = this._nodeSocket;
                this._nodeSocket = null;
                socket.destroy();
            }
        }
    },

    _setupEventListeners: function(){
        this.logger.info("websocket listening for data");
        this._dataListener = this._handleDataEvent.bind(this);
        this._closeListener = this._handleCloseEvent.bind(this);
        this._nodeSocket.addListener('data', this._dataListener);
        this._nodeSocket.addListener('close', this._closeListener);
    },

    _cleanupEventListeners: function(){
        if (this._dataListener !== null){
            this.logger.info("websocket un-listening for data");
            this._nodeSocket.removeListener('data', this._dataListener);
            this._dataListener = null;
        }
        if (this._closeListener !== null){
            this._nodeSocket.removeListener('close', this._closeListener);
            this._closeListener = null;
        }
    },

    _handleDataEvent: function(buffer){
        try{
            this._receive(JSData.initWithNodeBuffer(buffer));
        }catch (e){
            this.logger.error(e);
        }
    },

    _handleCloseEvent: function(){
        this.cleanup();
    }

});