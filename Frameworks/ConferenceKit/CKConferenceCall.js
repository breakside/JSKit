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

// #import Foundation
// #import "CKParticipantConnection.js"
// #import "CKParticipant.js"
// #import MediaKit
'use strict';

JSClass("CKConferenceCall", JSObject, {

    init: function(){
        this.turnServices = [];
        this.connectionsByParticipantID = {};
    },

    initWithTURNService: function(service){
        this.init();
        this.turnServices.push(service);
    },

    turnServices: null,
    connectionsByParticipantID: null,
    nextParticipantNumber: 1,
    localParticipant: JSDynamicProperty("_localParticipant", null),

    setLocalParticipant: function(participant){
        if (participant === this._localParticipant){
            return;
        }
        var stream = null;
        if (this._localParticipant !== null){
            stream = this._localParticipant.stream;
        }
        participant.isLocal = true;
        participant.number = this.nextParticipantNumber++;
        participant.call = this;
        this._localParticipant = participant;
        if (stream === null){
            this.openLocalStream();
        }else{
            participant.stream = stream;
        }
    },

    connectToParticipant: function(participant, isCaller){
        participant.number = this.nextParticipantNumber++;
        var connection = CKParticipantConnection.createForParticipant(participant);
        participant.call = this;
        connection.call = this;
        this.connectionsByParticipantID[participant.identifier] = connection;
        connection.setLocalStream(this._localParticipant.stream);
        connection.open(isCaller);
    },

    disconnectFromParticipant: function(participant){
        participant.call = null;
        this._closeConnectionForIdentifier(participant.identifier);
    },

    sendDescriptionToParticipant: function(description, participant){
        this.delegate.conferenceCallSendDescriptionToParticipant(this, description, participant);
    },

    sendCandidateToParticipant: function(candidate, participant){
        this.delegate.conferenceCallSendCandidateToParticipant(this, candidate, participant);
    },

    _didChangeMuteStateForParticipant: function(participant){
        if (this.delegate && this.delegate.conferenceCallDidChangeMuteStateForParticipant){
            this.delegate.conferenceCallDidChangeMuteStateForParticipant(this, participant);
        }
    },

    start: function(){
    },

    end: function(){
        var ids = Object.keys(this.connectionsByParticipantID);
        for (var i = 0, l = ids.length; i < l; ++i){
            this._closeConnectionForIdentifier(ids[i]);
        }
        if (this._localParticipant !== null){
            if (this._localParticipant.stream){
                this._localParticipant.stream.close();
            }
            this._localParticipant.call = null;
            this._localParticipant = null;
        }
    },

    fail: function(){
        this.end();
        if (this.delegate && this.delegate.conferenceCallDidFail){
            this.delegate.conferenceCallDidFail(this);
        }
    },

    _closeConnectionForIdentifier: function(id){
        var connection = this.connectionsByParticipantID[id];
        if (connection){
            connection.close();
            this._removeConnection(connection);
        }
    },

    _removeConnection: function(connection){
        connection.call = null;
        delete this.connectionsByParticipantID[connection.participant.identifier];
    },

    updateDescriptionForParticipant: function(description, participant){
        var connection = this.connectionsByParticipantID[participant.identifier];
        if (connection){
            connection.updateDescription(description);
        }
    },

    addCandidateForParticipant: function(candidate, participant){
        var connection = this.connectionsByParticipantID[participant.identifier];
        if (connection){
            connection.addCandidate(candidate);
        }
    },

    participantForIdentifier: function(identifier){
        if (this._localParticipant !== null && this._localParticipant.identifier === identifier){
            return this._localParticipant;
        }
        var connection = this.connectionsByParticipantID[identifier];
        if (connection){
            return connection.participant;
        }
        return null;
    },

    openLocalStream: function(){
        this._localParticipant._setVideoStreamMuted(false);
        if (this.delegate && this.delegate.conferenceCallWillStartStreamFromParticipant){
            this.delegate.conferenceCallWillStartStreamFromParticipant(this, this._localParticipant);
        }
        var type = MKStream.Type.audio;
        if (!this._localParticipant.videoSoftMuted){
            type |= MKStream.Type.video;
        }
        MKStream.openLocalStreamOfType(type, this.handleLocalStream, this);
    },

    handleLocalStream: function(stream){
        if (stream === null){
            this._localParticipant._setVideoStreamMuted(true);
            if (this.delegate && this.delegate.conferenceCallNeedsPermissionToLocalStream){
                this.delegate.conferenceCallNeedsPermissionToLocalStream(this, this.openLocalStream.bind(this));
            }
        }else{
            this._localParticipant.stream = stream;
            stream.audioMuted = this._localParticipant.audioSoftMuted;
            stream.videoMuted = this._localParticipant.videoSoftMuted;
            var connection;
            for (var id in this.connectionsByParticipantID){
                connection = this.connectionsByParticipantID[id];
                connection.setLocalStream(stream);
            }
            if (this.delegate && this.delegate.conferenceCallDidStartStreamFromParticipant){
                this.delegate.conferenceCallDidStartStreamFromParticipant(this, stream, this._localParticipant);
            }
        }
    },

});