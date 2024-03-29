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

var logger = JSLog("conference", "html-connection");

JSClass("CKHTMLParticipantConnection", CKParticipantConnection, {

    htmlPeerConnection: null,
    // htmlVideoTransceiver: null,
    // htmlAudioTransceiver: null,
    isCaller: false,

    open: function(isCaller){
        logger.info("opening connection to participant %{public}", this.participant.shortID);
        this.call.delegate.conferenceCallWillStartStreamFromParticipant(this.call, this.participant);
        var configuration = {
            iceServers: [],
            iceTransportPolicy: "all",
        };
        var service;
        var iceServer;
        for (var i = 0, l = this.call.turnServices.length; i < l; ++i){
            service = this.call.turnServices[i];
            iceServer = {
                urls: []
            };
            for (var j = 0, k = service.urls.length; j < k; ++j){
                iceServer.urls.push(service.urls[j]);
            }
            if (service.username !== null && service.password !== null){
                iceServer.credentialType = "password";
                iceServer.username = service.username;
                iceServer.credential = service.password;
            }
            if (iceServer.urls.length > 0){
                configuration.iceServers.push(iceServer);   
            }else{
                logger.error("No URLs for TURN service");
            }
        }
        this.isCaller = isCaller;
        this.htmlPeerConnection = new RTCPeerConnection(configuration);
        this.audioTrackNeedsUnmute = true;
        this.videoTrackNeedsUnmute = !this.participant.videoSoftMuted;
        this._updateLocalTracks();
        // if (this.isCaller){
        //     this.htmlVideoTransceiver = this.htmlPeerConnection.addTransceiver("video");
        //     this.htmlAudioTransceiver = this.htmlPeerConnection.addTransceiver("audio");
        //     this.remoteHTMLVideoTrack = this.htmlVideoTransceiver.receiver.track;
        //     this.remoteHTMLAudioTrack = this.htmlAudioTransceiver.receiver.track;
        //     this._updateLocalTracks();
        //     this._createRemoteStream();
        // }
        this.addPeerConnectionEventListeners();
    },

    close: function(){
        this.removePeerConnectionEventListeners();
        this.htmlPeerConnection.close();
        this.htmlPeerConnection = null;
        this.participant.stream = null;
    },

    sendLocalDescription: function(){
        try{
            var descriptionPromise;
            switch (this.htmlPeerConnection.signalingState){
                case "stable":
                case "have-local-offer":
                case "have-remote-pranswer":
                    logger.info("creating local description offer to participant %{public}", this.participant.shortID);
                    descriptionPromise = this.htmlPeerConnection.createOffer();
                    break;
                default:
                    logger.info("creating local description answer to participant %{public}", this.participant.shortID);
                    descriptionPromise = this.htmlPeerConnection.createAnswer();
                    break;
            }
            var connection = this;
            descriptionPromise.then(function(description){
                return connection.htmlPeerConnection.setLocalDescription(description);
            }).then(function(){
                var htmlDescription = connection.htmlPeerConnection.localDescription;
                if (htmlDescription !== null){
                    var description = CKSessionDescription.initWithHTMLDescription(htmlDescription);
                    logger.info("sending local description (%d) to participant %{public}", description.type, connection.participant.shortID);
                    connection.call.sendDescriptionToParticipant(description, connection.participant);
                }else{
                    logger.warn("null local description after setLocalDescription");
                }
            }).catch(function(error){
                logger.error("Failed to set local description, promise rejected with: %{error}", error);
            });
        }catch (e){
            logger.error("Failed to set local description, threw: %{error}", e);
        }
    },

    updateDescription: function(description){
        logger.info("updating remote description (%d) from participant %{public}", description.type,  this.participant.shortID);
        var htmlDescription = description.htmlDescription();
        try{
            var connection = this;
            this.htmlPeerConnection.setRemoteDescription(htmlDescription.toJSON()).then(function(){
                if (description.type === CKSessionDescription.Type.offer){
                    connection.sendLocalDescription();
                }
            }, function(error){
                logger.error("Failed to set remote description, promise rejected with: %{error}", error);
            });
        }catch (e){
            logger.error("Failed to set remote description, threw: %{error}", e);
            return;   
        }
    },

    addCandidate: function(candidate){
        if (candidate === null){
            logger.info("adding remote null candidate for participant %{public}", this.participant.shortID);
        }else{
            logger.info("adding remote candidate, %{public} @%{public}:%d, for participant %{public}", candidate.candidate, candidate.address || "null", candidate.port || -1, this.participant.shortID);
        }
        try{
            this.htmlPeerConnection.addIceCandidate(candidate).then(function(){
            }, function(error){
                logger.error("addIceCandidate failed: %{error}", error);
            });
        }catch (e){
            logger.error("Failed to addIceCandidate: %{error}", e);
        }
    },

    _localStream: null,

    setLocalStream: function(stream){
        logger.info("setting local stream on connection to participant %{public}", this.participant.shortID);
        this._localStream = stream;
        this._updateLocalTracks();
    },

    _senders: null,

    _updateLocalTracks: function(){
        logger.info("updating local tracks to participant %{public}", this.participant.shortID);
        if (this._localStream === null){
            logger.info("local stream not yet set %{public}", this.participant.shortID);
            return;
        }
        if (this.htmlPeerConnection === null){
            logger.info("connection not yet set %{public}", this.participant.shortID);
            return;
        }
        if (this._senders === null){
            this._senders = [];
        }
        var i, l;
        var sender;
        for (i = 0, l = this._senders.length; i < l; ++i){
            sender = this._senders[i];
            this.htmlPeerConnection.removeTrack(sender);
        }
        this._senders = [];
        var tracks = this._localStream.htmlMediaStream.getTracks();
        var track;
        for (i = 0, l = tracks.length; i < l; ++i){
            track = tracks[i];
            logger.info("adding local %{public} track to participant %{public}", track.kind, this.participant.shortID);
            sender = this.htmlPeerConnection.addTrack(tracks[i]);
            this._senders.push(sender);
        }
        // if (!(this._localStream instanceof MKHTMLStream)){
        //     logger.warn("local stream is not an html stream %{public}", this.participant.shortID);
        //     return;
        // }
        // if (this.htmlVideoTransceiver === null){
        //     logger.info("local video transceiver not yet set %{public}", this.participant.shortID);
        //     return;
        // }
        // if (this.htmlAudioTransceiver === null){
        //     logger.info("local audio transceiver not yet set %{public}", this.participant.shortID);
        //     return;
        // }
        // logger.info("replacing local video transceiver tracks to participant %{public}", this.participant.shortID);
        // var videoTrack = this._localStream.htmlMediaStream.getVideoTracks()[0];
        // var audioTrack = this._localStream.htmlMediaStream.getAudioTracks()[0];
        // this.htmlVideoTransceiver.sender.replaceTrack(videoTrack);
        // this.htmlAudioTransceiver.sender.replaceTrack(audioTrack);
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
        if (this.htmlPeerConnection === null){
            return;
        }
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
        logger.info("negotiation needed with participant %{public}", this.participant.shortID);
        // The browser wishes to inform the application that session negotiation needs to be done (i.e. a createOffer call followed by setLocalDescription).
        this.sendLocalDescription();
    },

    _event_icecandidate: function(event){
        // A new RTCIceCandidate is made available to the script.
        var candidate = event.candidate;
        if (candidate === null){
            logger.info("ice candidate null, not sending to participant %{public}", this.participant.shortID);
        }else{
            logger.info("sending ice candidate, %{public} @%{public}:%d, to participant %{public}", candidate.candidate, candidate.address || "null", candidate.port || -1, this.participant.shortID);
            this.call.sendCandidateToParticipant(candidate !== null ? candidate.toJSON() : null, this.participant);
        }
    },

    _event_icecandidateerror: function(event){
        // A failure occured when gathering ICE candidates.
        logger.warn("ice candidate error (%{public}): %{public} %d %{public}", this.participant.shortID, event.url, event.errorCode, event.errorText);
    },

    _event_signalingstatechange: function(event){
        // The signaling state has changed. This state change is the result of either setLocalDescription or setRemoteDescription being invoked.
        logger.info("signaling state change (%{public}): %{public}", this.participant.shortID, this.htmlPeerConnection.signalingState);
    },

    _event_iceconnectionstatechange: function(event){
        // The RTCPeerConnection's ICE connection state has changed.
        logger.info("ice connection state change (%{public}): %{public}", this.participant.shortID, this.htmlPeerConnection.iceConnectionState);
    },

    _event_icegatheringstatechange: function(event){
        // The RTCPeerConnection's ICE gathering state has changed.
        logger.info("ice gathering state change (%{public}): %{public}", this.participant.shortID, this.htmlPeerConnection.iceGatheringState);
    },

    _event_connectionstatechange: function(event){
        // The RTCPeerConnection.connectionState has changed.
        logger.info("connection state change (%{public}): %{public}", this.participant.shortID, this.htmlPeerConnection.connectionState);
        if (this.htmlPeerConnection.connectionState === "failed"){
            if (this.remoteHTMLAudioTrack !== null){
                logger.info("stopping audio track");
                this.remoteHTMLAudioTrack.stop();
            }
            if (this.remoteHTMLVideoTrack !== null){
                logger.info("stopping video track");
                this.remoteHTMLVideoTrack.stop();
            }
            this.notifyAfterInactive();
        }
    },

    remoteStream: null,
    remoteHTMLMediaStream: null,
    remoteHTMLVideoTrack: null,
    remoteHTMLAudioTrack: null,
    audioTrackNeedsUnmute: false,
    videoTrackNeedsUnmute: false,

    _event_track: function(event){
        // New incoming media has been negotiated for a specific RTCRtpReceiver, and that receiver's track has been added to any associated remote MediaStreams.
        var track = event.track;
        if (track.kind == "video"){
            if (this.remoteHTMLVideoTrack !== null){
                logger.info("%{public} removing previous video track", this.participant.shortID);
                this.remoteHTMLMediaStream.removeTrack(this.remoteHTMLVideoTrack);
                this.removeEventListenersFromTrack(this.remoteHTMLVideoTrack);
            }
            this.remoteHTMLVideoTrack = track;
            this.addEventListenersToTrack(this.remoteHTMLVideoTrack);
        }else if (track.kind == "audio"){
            if (this.remoteHTMLAudioTrack !== null){
                logger.info("%{public} removing previous audio track", this.participant.shortID);
                this.remoteHTMLMediaStream.removeTrack(this.remoteHTMLAudioTrack);
                this.removeEventListenersFromTrack(this.remoteHTMLAudioTrack);
            }
            this.remoteHTMLAudioTrack = track;
            this.addEventListenersToTrack(this.remoteHTMLAudioTrack);
        }
        if (this.remoteStream === null){
            logger.info("%{public} received remote %{public} track, creating stream", this.participant.shortID, track.kind);
            this.remoteHTMLMediaStream = new MediaStream([track]);
            this.remoteStream = MKHTMLStream.initWithHTMLMediaStream(this.remoteHTMLMediaStream);
            this.participant.stream = this.remoteStream;
        }else{
            logger.info("%{public} received remote %{public} track, adding to existing stream", this.participant.shortID, track.kind);
            this.remoteStream.addHTMLTrack(track);
        }
        // if (this.isCaller){
        //     logger.warn("received track as caller from participant %{public}", this.participant.shortID);
        //     return;
        // }
        // var transceiver = event.transceiver;
        // if (track.kind == "video"){
        //     if (this.remoteHTMLVideoTrack !== null){
        //         logger.warn("received additional video track from participant %{public}, caller: %b", this.participant.shortID, this.isCaller);
        //         return;
        //     }
        //     logger.info("received video track from participant %{public}, caller %b", this.participant.shortID, this.caller);
        //     this.htmlVideoTransceiver = transceiver;
        //     this.remoteHTMLVideoTrack = track;
        // }else if (track.kind == "audio"){
        //     if (this.remoteHTMLAudioTrack !== null){
        //         logger.warn("received additional audio track from participant %{public}, caller: %b", this.participant.shortID, this.isCaller);
        //         return;
        //     }
        //     logger.info("received audio track from participant %{public}, caller %b", this.participant.shortID, this.caller);
        //     this.htmlAudioTransceiver = transceiver;
        //     this.remoteHTMLAudioTrack = track;
        // }
        // if (!this.isCaller){
        //     this._updateLocalTracks();
        // }
        // this._createRemoteStream();
    },

    addEventListenersToTrack: function(track){
        track.addEventListener("mute", this);
        track.addEventListener("unmute", this);
        track.addEventListener("ended", this);
    },

    removeEventListenersFromTrack: function(track){
        track.removeEventListener("mute", this);
        track.removeEventListener("unmute", this);
        track.removeEventListener("ended", this);
    },

    _event_mute: function(event){
        if (event.currentTarget === this.remoteHTMLVideoTrack){
            if (this.videoTrackNeedsUnmute){
                logger.info("got video mute before first unmute for participant %{public}", this.participant.shortID);
            }else{
                logger.info("mute video from participant %{public}", this.participant.shortID);
                this.participant._setVideoStreamMuted(true);
            }
        }else if (event.currentTarget === this.remoteHTMLAudioTrack){
            if (this.audioTrackNeedsUnmute){
                logger.info("got audio mute before first unmute for participant %{public}", this.participant.shortID);
            }else{
                logger.info("mute audio from participant %{public}", this.participant.shortID);
                this.participant._setAudioStreamMuted(true);
            }
        }else{
            logger.warn("mute unknown track participant %{public}", this.participant.shortID);
        }
    },

    _event_unmute: function(event){
        if (event.currentTarget === this.remoteHTMLVideoTrack){
            logger.info("unmute video from participant %{public}", this.participant.shortID);
            if (this.videoTrackNeedsUnmute){
                this.videoTrackNeedsUnmute = false;
                this.notifyAfterAllUnmutes();
            }else{
                this.participant._setVideoStreamMuted(false);
            }
        }else if (event.currentTarget === this.remoteHTMLAudioTrack){
            logger.info("unmute audio from participant %{public}", this.participant.shortID);
            if (this.audioTrackNeedsUnmute){
                this.audioTrackNeedsUnmute = false;
                this.notifyAfterAllUnmutes();
            }else{
                this.participant._setAudioStreamMuted(false);
            }
        }else{
            logger.warn("mute unknown track from participant %{public}", this.participant.shortID);
        }
    },

    _event_ended: function(event){
        if (event.currentTarget === this.remoteHTMLVideoTrack){
            logger.info("video track ended from participant %{public}", this.participant.shortID);
            this.notifyAfterInactive();
        }else if (event.currentTarget === this.remoteHTMLAudioTrack){
            logger.info("audio track ended from participant %{public}", this.participant.shortID);
            this.notifyAfterInactive();
        }
    },

    notifyAfterAllUnmutes: function(){
        if (this.videoTrackNeedsUnmute){
            return;
        }
        if (this.audioTrackNeedsUnmute){
            return;
        }
        if (this.call.delegate && this.call.delegate.conferenceCallDidStartStreamFromParticipant){
            this.call.delegate.conferenceCallDidStartStreamFromParticipant(this.call, this.remoteStream, this.participant);
        }
    },

    notifyAfterInactive: function(){
        if (this.remoteHTMLMediaStream.active){
            logger.info("stream is active, not notifying delegate yet");
            return;
        }
        this.participant.stream = null;
        if (this.call.delegate && this.call.delegate.conferenceCallDidStopStreamFromParticipant){
            this.call.delegate.conferenceCallDidStopStreamFromParticipant(this.call, this.participant);
        }
        this.call._removeConnection(this);
    },

    // _createRemoteStream: function(){
    //     if (this.remoteHTMLVideoTrack === null){
    //         return;
    //     }
    //     if (this.remoteHTMLAudioTrack === null){
    //         return;
    //     }
    //     logger.info("creating stream from participant %{public}", this.participant.shortID);
    //     this.remoteHTMLMediaStream = new MediaStream([this.remoteHTMLVideoTrack, this.remoteHTMLAudioTrack]);
    //     this.remoteStream = MKHTMLStream.initWithHTMLMediaStream(this.remoteHTMLMediaStream);
    //     this.participant.stream = this.remoteStream;
    //     this.call.delegate.conferenceCallDidStartStreamFromParticipant(this.call, this.remoteStream, this.participant);
    // },

    _event_datachannel: function(event){
        // A new RTCDataChannel is dispatched to the script in response to the other peer creating a channel.
        logger.info("datachannel to participant %{public}", this.participant.shortID);
    },

});

CKParticipantConnection.createForParticipant = function(participant){
    var connection = CKHTMLParticipantConnection.initWithParticipant(participant);
    return connection;
};

})();