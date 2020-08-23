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

// #import MediaKit
// #import "CKParticipantConnection.js"
// #import "CKSessionDescription.js"
// #feature RTCPeerConnection
// jshint browser: true
/* global RTCPeerConnection, MediaStream, MKHTMLStream */
'use strict';

(function(){

var logger = JSLog("confcall", "html");

JSClass("CKHTMLParticipantConnection", CKParticipantConnection, {

    htmlPeerConnection: null,

    open: function(){
        var configuration = {
            iceServers: [],
            iceTransportPolicy: "all",
        };
        var service;
        var iceServer;
        for (var i = 0, l = this.call.turnServices.length; i < l; ++i){
            service = this.call.turnServices[i];
            iceServer = {
                urls: [service.url.encodedString]
            };
            if (service.username !== null && service.password !== null){
                iceServer.credentialType = "password";
                iceServer.username = service.username;
                iceServer.credential = service.password;
            }
            configuration.iceServers.push(iceServer);
        }
        this.htmlPeerConnection = new RTCPeerConnection(configuration);
        this.addPeerConnectionEventListeners();
    },

    close: function(){
        this.removePeerConnectionEventListeners();
        // TODO: anything else?
        this.htmlPeerConnection = null;
    },

    sendLocalDescription: function(type){
        var connection = this;
        var promise;
        if (type == CKSessionDescription.Type.offer){
            promise = this.htmlPeerConnection.createOffer();
        }else{
            promise = this.htmlPeerConnection.createAnswer();
        }
        promise.then(function(description){
            return connection.htmlPeerConnection.setLocalDescription(description);
        }).then(function(){
            var description = CKSessionDescription.initWithHTMLDescription(connection.htmlPeerConnection.localDescription);
            connection.call.delegate.conferenceCallSendDescriptionToParticipant(connection.call, description, connection.participant);
        }).catch(function(error){
            logger.error(error);
        });
    },

    updateDescription: function(description){
        var htmlDescription = description.htmlDescription();
        this.htmlPeerConnection.setRemoteDescription(htmlDescription.toJSON());
        if (description.type === CKSessionDescription.Type.offer){
            this.sendLocalDescription(CKSessionDescription.Type.answer);
        }
    },

    addCandidate: function(candidate){
        this.htmlPeerConnection.addIceCandidate(candidate);
    },

    setLocalStream: function(stream){
        if (stream instanceof MKHTMLStream){
            var tracks = stream.htmlMediaStream.getTracks();
            for (var i = 0, l = tracks.length; i < l; ++i){
                this.htmlPeerConnection.addTrack(tracks[i]);
            }
        }
    },

    addPeerConnectionEventListeners: function(){
        this.htmlPeerConnection.addEventListener("negotiationneeded", this);
        this.htmlPeerConnection.addEventListener("icecandidate", this);
        this.htmlPeerConnection.addEventListener("icecandidateerror", this);
        this.htmlPeerConnection.addEventListener("signalingstatechange", this);
        this.htmlPeerConnection.addEventListener("iceconnectionstatechange", this);
        this.htmlPeerConnection.addEventListener("icegatheringstatechange", this);
        this.htmlPeerConnection.addEventListener("connectionstatechange", this);
        this.htmlPeerConnection.addEventListener("track", this);
        this.htmlPeerConnection.addEventListener("datachannel", this);
    },

    removePeerConnectionEventListeners: function(){
        this.htmlPeerConnection.removeEventListener("negotiationneeded", this);
        this.htmlPeerConnection.removeEventListener("icecandidate", this);
        this.htmlPeerConnection.removeEventListener("icecandidateerror", this);
        this.htmlPeerConnection.removeEventListener("signalingstatechange", this);
        this.htmlPeerConnection.removeEventListener("iceconnectionstatechange", this);
        this.htmlPeerConnection.removeEventListener("icegatheringstatechange", this);
        this.htmlPeerConnection.removeEventListener("connectionstatechange", this);
        this.htmlPeerConnection.removeEventListener("track", this);
        this.htmlPeerConnection.removeEventListener("datachannel", this);
    },

    handleEvent: function(e){
        this["_event_" + e.type](e);
    },

    _event_negotiationneeded: function(event){
        logger.info("negotiationneeded");
        // The browser wishes to inform the application that session negotiation needs to be done (i.e. a createOffer call followed by setLocalDescription).
        this.sendLocalDescription(CKSessionDescription.Type.offer);
    },

    _event_icecandidate: function(event){
        logger.info("iecandidate");
        // A new RTCIceCandidate is made available to the script.
        var candidate = event.candidate;
        if (candidate !== null){
            this.call.delegate.conferenceCallSendCandidateToParticipant(this.call, candidate.toJSON(), this.participant);
        }
    },

    _event_icecandidateerror: function(event){
        // A failure occured when gathering ICE candidates.
        logger.warn("iecandidateerror");
    },

    _event_signalingstatechange: function(event){
        // The signaling state has changed. This state change is the result of either setLocalDescription or setRemoteDescription being invoked.
        logger.info("signalingstatechange");
    },

    _event_iceconnectionstatechange: function(event){
        // The RTCPeerConnection's ICE connection state has changed.
        logger.info("iceconnectionstatechange");
    },

    _event_icegatheringstatechange: function(event){
        // The RTCPeerConnection's ICE gathering state has changed.
        logger.info("gatheringstatechange");
    },

    _event_connectionstatechange: function(event){
        // The RTCPeerConnection.connectionState has changed.
        logger.info("connectionstatechange");
    },

    htmlMediaStream: null,

    _event_track: function(event){
        // New incoming media has been negotiated for a specific RTCRtpReceiver, and that receiver's track has been added to any associated remote MediaStreams.
        logger.info("track");
        var track = event.track;
        if (this.htmlMediaStream === null){
            this.htmlMediaStream = new MediaStream([track]);
            var stream = MKHTMLStream.initWithHTMLMediaStream(this.htmlMediaStream);
            this.call.delegate.conferenceCallDidReceiveStreamFromParticipant(this.call, stream, this.participant);
        }else{
            this.htmlMediaStream.addTrack(track);
        }
    },

    _event_datachannel: function(event){
        // A new RTCDataChannel is dispatched to the script in response to the other peer creating a channel.
        logger.info("datachannel");
    },

});

CKParticipantConnection.createForParticipant = function(participant){
    var connection = CKHTMLParticipantConnection.initWithParticipant(participant);
    return connection;
};

})();