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
'use strict';

JSClass("CKConferenceCall", JSObject, {

    init: function(){
        this.turnServices = [];
        this.connectionsByParticipantId = {};
    },

    initWithTURNService: function(service){
        this.init();
        this.turnServices.push(service);
    },

    turnServices: null,
    connectionsByParticipantId: null,

    connectToParticipant: function(participant, isCaller){
        var connection = CKParticipantConnection.createForParticipant(participant);
        connection.call = this;
        this.connectionsByParticipantId[participant.identifier] = connection;
        connection.open(isCaller);
        if (this._localStream){
            connection.setLocalStream(this._localStream);
        }
    },

    disconnectFromParticipant: function(participant){
        this._closeConnectionForIdentifier(participant.identifier);
    },

    end: function(){
        var ids = Object.keys(this.connectionsByParticipantId);
        for (var i = 0, l = ids.length; i < l; ++i){
            this._closeConnectionForIdentifier(ids[i]);
        }
    },

    _closeConnectionForIdentifier: function(id){
        var connection = this.connectionsByParticipantId[id];
        if (connection){
            connection.close();
            connection.call = null;
            delete this.connectionsByParticipantId[id];
        }
    },

    updateDescriptionForParticipant: function(description, participant){
        var connection = this.connectionsByParticipantId[participant.identifier];
        if (connection){
            connection.updateDescription(description);
        }
    },

    addCandidateForParticipant: function(candidate, participant){
        var connection = this.connectionsByParticipantId[participant.identifier];
        if (connection){
            connection.addCandidate(candidate);
        }
    },

    participantForIdentifier: function(identifier){
        var connection = this.connectionsByParticipantId[identifier];
        if (connection){
            return connection.participant;
        }
        return null;
    },

    localMicrophoneMuted: JSReadOnlyProperty("_localMicrophoneMuted", false),

    muteLocalMicrophone: function(){
        this._localMicrophoneMuted = true;
        this._updateLocalStreamMuted();
    },

    unmuteLocalMicrophone: function(){
        this._localMicrophoneMuted = false;
        this._updateLocalStreamMuted();
    },

    _updateLocalStreamMuted: function(){
        if (this._localStream !== null){
            if (this._localMicrophoneMuted){
                this._localStream.muteAudio();
            }else{
                this._localStream.unmuteAudio();
            }
        }
    },

    _localStream: null,

    setLocalStream: function(stream){
        this._localStream = stream;
        this._updateLocalStreamMuted();
        var connection;
        for (var id in this.connectionsByParticipantId){
            connection = this.connectionsByParticipantId[id];
            connection.setLocalStream(stream);
        }
    },

    remoteStreamForParticipant: function(participant){
        var connection = this.connectionsByParticipantId[participant.identifier];
        if (connection){
            return connection.remoteStream;
        }
        return null;
    },

    updateAudioMuteForParticipant: function(muted, participant){
        if (muted != participant.audioSoftMuted){
            participant._setAudioSoftMuted(muted);
            if (this.delegate && this.delegate.conferenceCallParticipantDidChangeMuteState){
                this.delegate.conferenceCallParticipantDidChangeMuteState(this, participant);
            }
        }
    }

});