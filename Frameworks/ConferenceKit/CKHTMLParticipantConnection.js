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
    htmlVideoTransceiver: null,
    isCaller: false,

    open: function(isCaller){
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
        this.isCaller = isCaller;
        this.htmlPeerConnection = new RTCPeerConnection(configuration);
        // if (this.isCaller){
        //     this.htmlVideoTransceiver = this.htmlPeerConnection.addTransceiver("video");
        //     this.htmlMediaStream = new MediaStream([this.htmlVideoTransceiver.receiver.track]);
        //     var stream = MKHTMLStream.initWithHTMLMediaStream(this.htmlMediaStream);
        //     this.call.delegate.conferenceCallDidReceiveStreamFromParticipant(this.call, stream, this.participant);
        // }
        this.addPeerConnectionEventListeners();
    },

    close: function(){
        this.removePeerConnectionEventListeners();
        this.htmlPeerConnection.close();
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
            logger.info("sending local description %d", description.type);
            connection.call.delegate.conferenceCallSendDescriptionToParticipant(connection.call, description, connection.participant);
        }).catch(function(error){
            logger.error(error);
        });
    },

    updateDescription: function(description){
        logger.info("setting remote description %d", description.type);
        var htmlDescription = description.htmlDescription();
        this.htmlPeerConnection.setRemoteDescription(htmlDescription.toJSON());
        if (description.type === CKSessionDescription.Type.offer){
            this.sendLocalDescription(CKSessionDescription.Type.answer);
        }
    },

    addCandidate: function(candidate){
        if (candidate === null){
            logger.info("adding remote null candidate");
        }else{
            logger.info("adding remote candidate: %{public} @%{public}:%d", candidate.candidate, candidate.address || "null", candidate.port || -1);
        }
        this.htmlPeerConnection.addIceCandidate(candidate);
    },

    _localStream: null,

    setLocalStream: function(stream){
        logger.info("setting local stream");
        this._localStream = stream;
        var tracks = this._localStream.htmlMediaStream.getTracks();
        var track;
        for (var i = 0, l = tracks.length; i < l; ++i){
            track = tracks[i];
            logger.info("adding local %{public} track", track.kind);
            this.htmlPeerConnection.addTrack(tracks[i]);
        }
        // this._updateTransceiverTracks();
    },

    _updateTransceiverTracks: function(){
        logger.info("updating transceiver tracks");
        if (this._localStream !== null){
            if (this._localStream instanceof MKHTMLStream){
                if (this.htmlVideoTransceiver !== null){
                    var videoTrack = this._localStream.htmlMediaStream.getVideoTracks()[0];
                    this.htmlVideoTransceiver.sender.replaceTrack(videoTrack);
                    logger.info("transceiver track replaced");
                }else{
                    logger.info("transceiver not yet set");
                }
            }else{
                logger.warn("local stream is not an html stream");
            }
        }else{
            logger.info("local stream not yet set");
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
        logger.info("negotiation needed");
        // The browser wishes to inform the application that session negotiation needs to be done (i.e. a createOffer call followed by setLocalDescription).
        this.sendLocalDescription(CKSessionDescription.Type.offer);
    },

    _event_icecandidate: function(event){
        // A new RTCIceCandidate is made available to the script.
        var candidate = event.candidate;
        if (candidate === null){
            logger.info("ice candidate null, not sending to peer");
        }else{
            logger.info("ice candidate: %{public} @%{public}:%d", candidate.candidate, candidate.address || "null", candidate.port || -1);
            this.call.delegate.conferenceCallSendCandidateToParticipant(this.call, candidate !== null ? candidate.toJSON() : null, this.participant);
        }
    },

    _event_icecandidateerror: function(event){
        // A failure occured when gathering ICE candidates.
        logger.warn("ice candidate error: %{public} %d %{public}", event.url, event.errorCode, event.errorText);
    },

    _event_signalingstatechange: function(event){
        // The signaling state has changed. This state change is the result of either setLocalDescription or setRemoteDescription being invoked.
        logger.info("signaling state change: %{public}", this.htmlPeerConnection.signalingState);
    },

    _event_iceconnectionstatechange: function(event){
        // The RTCPeerConnection's ICE connection state has changed.
        logger.info("ice connection state change: %{public}", this.htmlPeerConnection.iceConnectionState);
    },

    _event_icegatheringstatechange: function(event){
        // The RTCPeerConnection's ICE gathering state has changed.
        logger.info("ice gathering state change: %{public}", this.htmlPeerConnection.iceGatheringState);
    },

    _event_connectionstatechange: function(event){
        // The RTCPeerConnection.connectionState has changed.
        logger.info("connection state change: %{public}", this.htmlPeerConnection.connectionState);
    },

    htmlMediaStream: null,
    htmlVideoTrack: null,
    htmlAudioTrack: null,

    _event_track: function(event){
        // New incoming media has been negotiated for a specific RTCRtpReceiver, and that receiver's track has been added to any associated remote MediaStreams.
        var track = event.track;
        if (track.kind == "video"){
            if (this.htmlVideoTrack !== null){
                this.removeEventListener("mute", this.htmlVideoTrack);
                this.removeEventListener("unmute", this.htmlVideoTrack);
            }
            this.htmlVideoTrack = track;
            this.htmlVideoTrack.addEventListener("mute", this);
            this.htmlVideoTrack.addEventListener("unmute", this);
        }else if (track.kind == "audio"){
            if (this.htmlAudioTrack !== null){
                this.removeEventListener("mute", this.htmlAudioTrack);
                this.removeEventListener("unmute", this.htmlAudioTrack);
            }
            this.htmlAudioTrack = track;
            this.htmlAudioTrack.addEventListener("mute", this);
            this.htmlAudioTrack.addEventListener("unmute", this);
        }
        if (this.htmlMediaStream === null){
            logger.info("received remote %{public} track, creating stream", track.kind);
            this.htmlMediaStream = new MediaStream([track]);
            this.remoteStream = MKHTMLStream.initWithHTMLMediaStream(this.htmlMediaStream);
            this.call.delegate.conferenceCallDidReceiveStreamFromParticipant(this.call, this.remoteStream, this.participant);
        }else{
            logger.info("received remote %{public} track, adding to existing stream", track.kind);
            this.htmlMediaStream.addTrack(track);
        }
        // if (!this.isCaller){
        //     logger.info("setting transceiver");
        //     this.htmlVideoTransceiver = event.transceiver;
        //     this._updateTransceiverTracks();
        // }
    },

    _event_mute: function(event){
        if (event.currentTarget === this.htmlVideoTrack){
            this.participant._setVideoStreamMuted(true);
        }else if (event.currentTarget === this.htmlAudioTrack){
            this.participant._setAudioStreamMuted(true);
        }else{
            return;
        }
        if (this.call.delegate && this.call.delegate.conferenceCallParticipantDidChangeMuteState){
            this.call.delegate.conferenceCallParticipantDidChangeMuteState(this.call, this.participant);
        }
    },

    _event_unmute: function(event){
        if (event.currentTarget === this.htmlVideoTrack){
            this.participant._setVideoStreamMuted(false);
        }else if (event.currentTarget === this.htmlAudioTrack){
            this.participant._setAudioStreamMuted(false);
        }else{
            return;
        }
        if (this.call.delegate && this.call.delegate.conferenceCallParticipantDidChangeMuteState){
            this.call.delegate.conferenceCallParticipantDidChangeMuteState(this.call, this.participant);
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