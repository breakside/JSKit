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

// #import "MKAsset.js"
// #import "MKRemoteAsset.js"
// #import "MKHTMLStream.js"
/* global document, window */
'use strict';

(function(){

var logger = JSLog("medikit", "asset");

MKAsset.definePropertiesFromExtensions({

    imageAtPlaybackTime: function(playbackTime, completion, target){
        if (completion === undefined){
            completion = Promise.completion(Promise.resolveNonNull);
        }
        var video = document.createElement("video");
        video.playsInline = true;
        video.crossOrigin = "anonymous";
        var loadedmetadata = function(){
            // logger.debug("loadedmetadata %f", video.currentTime);
            video.removeEventListener("loadedmetadata", loadedmetadata);
        };
        var loadeddata = function(){
            // logger.debug("loadeddata %f", video.currentTime);
            video.removeEventListener("loadeddata", loadeddata);
        };
        var canplay = function(){
            // logger.debug("canplay %f", video.currentTime);
            video.removeEventListener("canplay", canplay);
            // logger.debug("setting time to %f", playbackTime);
            video.currentTime = playbackTime;
            video.addEventListener("timeupdate", timeupdate);
        };
        var timeupdate = function(){
            // logger.debug("timeupdate %f", video.currentTime);
            if (Math.abs(video.currentTime - playbackTime) > 0.02){
                // logger.debug("correcting time to %f", playbackTime);
                video.currentTime = playbackTime;
            }else{
                video.removeEventListener("timeupdate", timeupdate);
                video.addEventListener("seeked", seeked);
            }
        };
        var seeked = function(){
            // logger.debug("seeked %f", video.currentTime);
            video.removeEventListener("seeked", seeked);
            // logger.debug("capture requested");
            window.requestAnimationFrame(capture);
        };
        var capture = function(){
            // logger.debug("capture");
            var canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            var context = canvas.getContext("2d");
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            // logger.debug("drawn");
            canvas.toBlob(function(blob){
                // logger.debug("blob");
                var reader = new FileReader();
                reader.addEventListener("loadend", function(){
                    // logger.debug("read");
                    if (reader.error){
                        logger.error("Error reading blob: %{error}", reader.error);
                        completion.call(target, null);
                        return;
                    }
                    var data = JSData.initWithBuffer(reader.result);
                    var image = JSImage.initWithData(data);
                    // logger.debug("completion");
                    completion.call(target, image);
                });
                reader.readAsArrayBuffer(blob);
            }, "image/jpeg");
        };
        video.addEventListener("canplay", canplay);
        video.addEventListener("loadeddata", loadeddata);
        video.addEventListener("loadedmetadata", loadedmetadata);
        if (this.isKindOfClass(MKHTMLStream)){
            video.srcObject = this.htmlMediaStream;
        }else if (this.isKindOfClass(MKRemoteAsset)){
            video.src = this.url.encodedString;
        }else{
            logger.warning("unsupported asset class: %{public}", this.$class.className);
            JSRunLoop.main.schedule(completion, target, null);
        }
        video.load();
        return completion.promise;
    },

});

})();