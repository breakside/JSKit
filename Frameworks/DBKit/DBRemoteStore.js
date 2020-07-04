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

// #import "DBPersistentObjectStore.js"
'use strict';

(function(){

var logger = JSLog("dbkit", "client");

JSClass("DBRemoteStore", DBPersistentObjectStore, {

    initWithURL: function(url, urlSession){
        this.url = url;
        this.urlSession = urlSession || JSURLSession.shared;
        this.activeRequestsById = {};
        this.open();
    },

    open: function(){
        this.task = this.urlSession.streamTaskWithURL(this.url, ['dbkit1']);
        this.task.delegate = this;
        this.task.resume();
    },

    activeSendsById: null,
    nextMessageId: 1,

    sendJSON: function(type, payload, completion, target){
        var id = this.nextMessageId++;
        if (id > 0x7FFF){
            id = 1;
        }
        var data = JSData.initWithArray([(id & 0xFF00) >> 8, id & 0xFF, type]);
        try{
            var json = JSON.stringify(payload);
            var jsondata = json.ut8();
            data = data.initWithChunks([data, jsondata]);
        }catch (e){
            completion.call(target, e, null);
            return;
        }
        if (id in this.activeSendsById){
            completion.call(target, new Error("message id collision"), null);
            return;
        }
        this.activeSendsById[id] = {
            type: type,
            completion: completion,
            target: target
        };
        this.task.sendMessage(data);
    },

    task: null,
    connected: false,

    taskDidOpenStream: function(task){
        this.connected = true;
    },

    taskDidCloseStream: function(task){
        if (this.connected){
            this.connected = false;
            var send;
            for (var id in this.activeSendsById){
                send = this.activeSendsById[id];
                send.completion.call(send.target, new Error("stream closed"));
            }
            this.activeSendsById = {};
        }
    },

    messageHeaderRange: JSRange(0, 3),

    taskDidReceiveStreamData: function(task, data){
        if (data.length < 3){
            logger.error("Received message too short");
            return;
        }
        var id = (data[0] << 8) | data[1];
        var requestType = data[2];
        var active = this.activeSendsById[id];
        if (!active){
            logger.error("Received unexpected message id: %d", id);
            return;
        }
        if (requestType != active.type){
            logger.error("Received unexpected type for message id %d", id);
            return;
        }
        delete this.activeSendsById[id];
        active.completion.call(active.target, null, data.subdataInRange(this.messageHeaderRange));
    },

    taskDidReceiveStreamError: function(task, error){
        logger.error("task received error: %{error}", error);
    },

    object: function(id, completion, target){
        if (!completion){
            completion = Promise.completion();
        }
        this.sendJSON(DBRemoteStore.MessageType.getObject, {id: id}, function(error, response){
            if (error !== null){
                logger.error(error);
                completion.call(target, null);
                return;
            }
            var object = null;
            try{
                var json = response.stringByDecodingUTF8();
                object = JSON.parse(json);
            }catch(e){
                logger.error("Invalid JSON for object get");
            }
            completion.call(target, object);
        }, this);
        return completion.promise;
    },

    save: function(object, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this.sendJSON(DBRemoteStore.MessageType.putObject, {object: object}, function(error, response){
            if (error !== null){
                logger.error(error);
                completion.call(target, null);
                return;
            }
            completion.call(target, response.length > 0 && response[0] !== 0);
        }, this);
        return completion.promise;
    },

    delete: function(id, completion, target){
        if (!completion){
            completion = Promise.completion(Promise.resolveTrue);
        }
        this.sendJSON(DBRemoteStore.MessageType.deleteObject, {id: id}, function(error, response){
            if (error !== null){
                logger.error(error);
                completion.call(target, null);
                return;
            }
            completion.call(target, response.length > 0 && response[0] !== 0);
        }, this);
        return completion.promise;
    }

});

DBRemoteStore.MessageType = {
    getObject: 0x01,
    putObject: 0x02,
    deleteObject: 0x03
};

})();