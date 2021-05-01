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

    url: null,
    urlSession: null,

    initWithURL: function(url, urlSession){
        this.url = url;
        this.urlSession = urlSession || JSURLSession.shared;
        this.localParticipantID = this.url.query.get("username");
    },

    sideChannelTask: null,
    sideChannelConnected: false,

    start: function(){
        if (this.sideChannelTask === null){
            this.sideChannelTask = this.urlSession.streamTaskWithURL(this.url, ["conf1"]);
            this.sideChannelTask.streamDelegate = this;
            this.sideChannelTask.resume();
        }
    },

    end: function(){
        this.sideChannelTask.streamDelegate = null;
        this.sideChannelTask.cancel();
        this.sideChannelTask = null;
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

    setLocalAudioMuted: function(muted){
        if (this.localAudioMuted !== muted){
            CKManagedConferenceCall.$super.setLocalAudioMuted.call(this, muted);
            this.sendSideChannelMessage({type: "mute", audioMuted: muted});
        }
    },

    setLocalVideoMuted: function(muted){
        if (this.localVideoMuted !== muted){
            CKManagedConferenceCall.$super.setLocalVideoMuted.call(this, muted);
            this.sendSideChannelMessage({type: "mute", videoMuted: muted});
        }
    },

    taskDidOpenStream: function(task){
        logger.info("stream open");
        this.sideChannelConnected = true;
    },

    taskDidCloseStream: function(task){
        logger.info("stream closed");
        this.sideChannelConnected = false;
    },

    taskDidReceiveStreamError: function(task){
        logger.error("room error");
        // TODO:
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

    sendSideChannelMessage: function(message){
        if (!this.sideChannelConnected){
            // TODO: queue messages until connected
            return;
        }
        var data = JSON.stringify(message);
        this.sideChannelTask.sendSideChannelMessage(data);
    },

    handleConnectedMessage: function(message){
        // TODO: handle reconnect situation
        // - only connect to participants we aren't already connected to
        // - don't bother updating TURN services?
        // - don't request local stream
        // - update participants
        // - ??
        var turnService = CKTURNService.initWithURLs(message.turn.uris, this.url.query.get("username"), this.url.query.get("password"));
        this.turnServices.push(turnService);

        var participant;
        var participants;
        var participantDictionary;
        var i, l;
        for (i = 0, l = message.participants.length; i < l; ++i){
            participantDictionary = message.participants[i];
            participant = CKParticipant.initWithIdentifier(participantDictionary.id);
            participant.audioSoftMuted = participantDictionary.audioMuted;
            participant.videoSoftMuted = participantDictionary.videoMuted;
            if (participantDictionary.id == this.localParticipantID){
                this.localParticpant = participant;
                this.requestLocalStream();
            }else{
                participants.push(participant);
            }
        }

        for (i = 0, l = participants.length; i < l; ++i){
            this.connectToParticipant(participants[i], true);
        }
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
        var existing = this.participantForIdentifier(message.participant.id);
        if (existing !== null){
            if (existing.connected && !message.participant.connected){
                this.disconnectFromParticipant(existing);
            }
            existing.audioSoftMuted = message.participant.audioMuted;
            existing.videoSoftMuted = message.participant.videoMuted;
        }else{
            var participant = CKParticipant.initWithIdentifier(message.participant.id);
            participant.audioSoftMuted = message.participant.audioMuted;
            participant.videoSoftMuted = message.participant.videoMuted;
            this.connectToParticipant(participant, false);
        }
    }

});

})();