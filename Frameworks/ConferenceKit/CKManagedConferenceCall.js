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

// #import ConferenceKit
"use strict";

(function(){

var logger = JSLog("conference", "managed-call");

JSClass("CKManagedConferenceCall", CKConferenceCall, {

    // ----------------------------------------------------------------------
    // MARK: - Creating a managed call

    url: null,
    urlSession: null,

    initWithURL: function(url, urlSession){
        this.url = url;
        this.urlSession = urlSession || JSURLSession.shared;
        this.localParticipantID = this.url.query.get("username");
        this.sideChannelSendQueue = [];
    },

    // ----------------------------------------------------------------------
    // MARK: - Overrides

    start: function(){
        CKManagedConferenceCall.$super.start.call(this);
        this.openSideChannel();
    },

    end: function(){
        this.closeSideChannel();
        CKManagedConferenceCall.$super.end.call(this);
    },

    sendDescriptionToParticipant: function(description, participant){
        logger.info("send description");
        var message = {
            type: "description",
            from: this.localParticipantID,
            to: participant.identifier,
            description: {
                type: description.type,
                value: description.value
            }
        };
        this.sendSideChannelMessage(message);
    },

    sendCandidateToParticipant: function(candidate, participant){
        logger.info("send candidate");
        var message = {
            type: "candidate",
            from: this.localParticipantID,
            to: participant.identifier,
            candidate: candidate
        };
        this.sendSideChannelMessage(message);
    },

    _didChangeMuteStateForParticipant: function(participant){
        CKManagedConferenceCall.$super._didChangeMuteStateForParticipant.call(this, participant);
        if (participant === this._localParticipant){
            this.sendSideChannelMessage({type: "mute", audioMuted: participant.audioSoftMuted, videoMuted: participant.videoSoftMuted});
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Side Channel

    sideChannelTask: null,
    sideChannelStreamOpen: false,
    sideChannelConnected: false,

    openSideChannel: function(){
        if (this.sideChannelTask === null){
            this.sideChannelTask = this.urlSession.streamTaskWithURL(this.url, ["conf1"]);
            this.sideChannelTask.streamDelegate = this;
            this.sideChannelTask.resume();
        }
    },

    closeSideChannel: function(){
        if (this.sideChannelTask !== null){
            this.sideChannelTask.streamDelegate = null;
            this.sideChannelTask.cancel();
            this.sideChannelTask = null;
            this.sideChannelConnected = false;
            this.sideChannelStreamOpen = false;
        }
    },

    reconnectAttempts: 0,
    maximumReconnectAttempts: 3,
    initialReconnectWaitInterval: 0.5,
    _reconnectWaitInterval: null,
    _reconnectTimer: null,

    reconnectSideChannel: function(){
        if (this._reconnectTimer !== null){
            this._reconnectTimer.invalidate();
            this._reconnectTimer = null;
        }
        if (this.reconnectAttempts < this.maximumReconnectAttempts){
            this.openSideChannel();
        }else{
            this.fail();
        }
    },

    taskDidOpenStream: function(task){
        logger.info("side channel open");
        this.sideChannelStreamOpen = true;
        this.reconnectAttempts = 0;
        this._reconnectWaitInterval = null;
    },

    taskDidCloseStream: function(task){
        logger.info("side channel closed");
        this.sideChannelConnected = false;
        this.sideChannelStreamOpen = false;
        this.sideChannelTask.streamDelegate = null;
        this.sideChannelTask = null;
        this.reconnectSideChannel();
    },

    taskDidReceiveStreamError: function(task){
        if (!this.sideChannelStreamOpen){
            logger.error("error opening side channel");
            this.sideChannelTask.streamDelegate = null;
            this.sideChannelTask = null;
            if (this._reconnectTimer === null){
                if (this._reconnectWaitInterval === null){
                    this._reconnectWaitInterval = this.initialReconnectWaitInterval;
                }
                this._reconnectTimer = JSTimer.scheduledTimerWithInterval(this._reconnectWaitInterval, this.reconnectSideChannel, this);
                this._reconnectWaitInterval *= 2;
            }
        }else{
            logger.error("error when side channel open");
        }
    },

    taskDidReceiveStreamData: function(task, data){
        if (data[0] == 0x7B){
            var message = null;
            try{
                var json = String.initWithData(data, String.Encoding.utf8);
                message = JSON.parse(json);
            }catch(e){
                logger.error(e);
                return;
            }
            this.receiveSideChannelMessage(message);
        }else{
            logger.warn("received non-JSON message from server");
        }
    },

    // ----------------------------------------------------------------------
    // MARK: - Side Channel Messages

    sideChannelSendQueue: null,

    sendSideChannelMessage: function(message){
        if (!this.sideChannelStreamOpen){
            this.sideChannelSendQueue.push(message);
            return;
        }
        var data = JSON.stringify(message);
        this.sideChannelTask.sendSideChannelMessage(data);
    },

    flushSideChannelSendQueue: function(){
        var messages = this.sideChannelSendQueue;
        this.sideChannelSendQueue = [];
        for (var i = 0, l = messages.length; i < l; ++i){
            this.sendSideChannelMessage(messages[i]);
        }
    },

    receiveSideChannelMessage: function(message){
        if (message.type == "connected"){
            this.handleConnectedMessage(message);
        }else if (message.type == "description"){
            this.handleDescriptionMessage(message);
        }else if (message.type == "candidate"){
            this.handleCandidateMessage(message);
        }else if (message.type == "participant"){
            this.handleParticipantMessage(message);
        }else{
            logger.info("unknown message type: %{public}", message.type);
        }
    },

    handleConnectedMessage: function(message){
        var turnService = CKTURNService.initWithURLs(message.turn.uris, this.url.query.get("username"), this.url.query.get("password"));
        this.turnServices = [turnService];

        var participant;
        var newParticipants;
        var participantDictionary;
        var i, l;
        for (i = 0, l = message.participants.length; i < l; ++i){
            participantDictionary = message.participants[i];
            participant = this.participantForIdentifier(participantDictionary.id);
            if (participant === null){
                participant = CKParticipant.initWithIdentifier(participantDictionary.id);
                newParticipants.push(participant);
            }
            participant.audioSoftMuted = participantDictionary.audioMuted;
            participant.videoSoftMuted = participantDictionary.videoMuted;
            if (participant.identifier == this.localParticipantID){
                this.localParticpant = participant;
            }
        }

        for (i = 0, l = newParticipants.length; i < l; ++i){
            participant = newParticipants[i];
            if (participant.identifier != this.localParticpantID){
                this.connectToParticipant(participant, true);
            }
        }

        this.sideChannelConnected = true;
        this.flushSideChannelSendQueue();
    },

    handleDescriptionMessage: function(message){
        logger.info("receive description");
        var description = CKSessionDescription.initWithType(message.description.type, message.description.value);
        var sender = this.participantForIdentifier(message.from);
        this.updateDescriptionForParticipant(description, sender);
    },

    handleCandidateMessage: function(message){
        logger.info("receive candidate");
        var sender = this.participantForIdentifier(message.from);
        this.addCandidateForParticipant(message.candidate, sender);
    },

    handleParticipantMessage: function(message){
        var participant = this.participantForIdentifier(message.participant.id);
        if (participant === null){
            participant = CKParticipant.initWithIdentifier(message.participant.id);
        }
        participant.audioSoftMuted = message.participant.audioMuted;
        participant.videoSoftMuted = message.participant.videoMuted;
        if (!participant.connected && message.participant.connected){
            participant.connected = true;
            this.connectToParticipant(participant, false);
        }else if (participant.connected && !message.participant.connected){
            participant.connected = false;
        }
    }

});

})();