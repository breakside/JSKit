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
        this.participants = [];
        this.connectionsByParticipantId = {};
    },

    initWithTURNService: function(service){
        this.init();
        this.turnServices.push(service);
    },

    turnServices: null,
    participants: null,
    connectionsByParticipantId: null,

    connectToParticipant: function(participant){
        this.participants.push(participant);
        var connection = CKParticipantConnection.createForParticipant(participant);
        connection.call = this;
        this.connectionsByParticipantId[participant.identifier] = connection;
        connection.open();
        if (this._localStream){
            connection.setLocalStream(this._localStream);
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

    _localStream: null,

    setLocalStream: function(stream){
        this._localStream = stream;
        var connection;
        for (var id in this.connectionsByParticipantId){
            connection = this.connectionsByParticipantId[id];
            connection.setLocalStream(stream);
        }
    }

});