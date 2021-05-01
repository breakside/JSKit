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
        participant.number = this.nextParticipantNumber++;
        this._localParticipant = participant;
        participant.addObserverForKeyPath(this, "audioMuted");
        participant.addObserverForKeyPath(this, "videoMuted");
        this.requestLocalStream();
    },

    connectToParticipant: function(participant, isCaller){
        participant.number = this.nextParticipantNumber++;
        var connection = CKParticipantConnection.createForParticipant(participant);
        participant.addObserverForKeyPath(this, "audioMuted");
        participant.addObserverForKeyPath(this, "videoMuted");
        connection.call = this;
        this.connectionsByParticipantID[participant.identifier] = connection;
        connection.setLocalStream(this._localStream);
        connection.open(isCaller);
    },

    disconnectFromParticipant: function(participant){
        participant.removeObserverForKeyPath(this, "audioMuted");
        participant.removeObserverForKeyPath(this, "videoMuted");
        this._closeConnectionForIdentifier(participant.identifier);
    },

    sendDescriptionToParticipant: function(description, participant){
        this.delegate.conferenceCallSendDescriptionToParticipant(this, description, participant);
    },

    sendCandidateToParticipant: function(candidate, participant){
        this.delegate.conferenceCallSendCandidateToParticipant(this, candidate, participant);
    },

    end: function(){
        var ids = Object.keys(this.connectionsByParticipantID);
        for (var i = 0, l = ids.length; i < l; ++i){
            this._closeConnectionForIdentifier(ids[i]);
        }
    },

    _closeConnectionForIdentifier: function(id){
        var connection = this.connectionsByParticipantID[id];
        if (connection){
            connection.close();
            connection.call = null;
            delete this.connectionsByParticipantID[id];
        }
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

    localAudioMuted: JSDynamicProperty("_localAudioMuted", false),
    localVideoMuted: JSDynamicProperty("_localVideoMuted", false),

    setLocalAudioMuted: function(muted){
        if (muted !== this._localAudioMuted){
            this._localAudioMuted = muted;
            if (this._localStream !== null){
                this._localStream.audioMuted = muted;
            }
            if (this.delegate && this.delegate.conferenceCallDidChangeLocalMuteState){
                this.delegate.conferenceCallDidChangeLocalMuteState(this);
            }
        }
    },

    setLocalVideoMuted: function(muted){
        if (muted !== this._localVideoMuted){
            this._localVideoMuted = muted;
            if (this._localStream !== null){
                this._localStream.videoMuted = muted;
            }
            if (this.delegate && this.delegate.conferenceCallDidChangeLocalMuteState){
                this.delegate.conferenceCallDidChangeLocalMuteState(this);
            }
        }
    },

    localStream: JSDynamicProperty("_localStream", null),

    setLocalStream: function(stream){
        this._localStream = stream;
        this._localStream.audioMuted = this._localAudioMuted;
        this._localStream.videoMuted = this._localVideoMuted;
        var connection;
        for (var id in this.connectionsByParticipantID){
            connection = this.connectionsByParticipantID[id];
            connection.setLocalStream(stream);
        }
        if (this.delegate && this.delegate.conferenceCallDidReceiveLocalStream){
            this.delegate.conferenceCallDidReceiveLocalStream(this, stream);
        }
    },

    requestLocalStream: function(){
        this.localVideoMuted = false;
        if (this.delegate && this.delegate.conferenceCallWillReceiveLocalStream){
            this.delegate.conferenceCallWillReceiveLocalStream(this);
        }
        MKStream.requestLocalStream(MKStream.Type.audioVideo, this.handleLocalStream, this);
    },

    handleLocalStream: function(stream){
        if (stream === null){
            this.localVideoMuted = true;
            if (this.delegate && this.delegate.conferenceCallNeedsPermissionToLocalStream){
                this.deleagte.conferenceCallNeedsPermissionToLocalStream(this);
            }
        }else{
            this.setLocalStream(stream);
        }
    },

    remoteStreamForParticipant: function(participant){
        var connection = this.connectionsByParticipantID[participant.identifier];
        if (connection){
            return connection.remoteStream;
        }
        return null;
    },

    observeValueForKeyPath: function(keyPath, ofObject, change, context){
        if (ofObject.isKindOfClass(CKParticipant)){
            if (this.delegate && this.delegate.conferenceCallDidChangeMuteStateForParticipant){
                this.delegate.conferenceCallDidChangeMuteStateForParticipant(this, ofObject);
            }
        }
    }

});