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
/* global document */
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
        var loadmetadata = function(){
            video.currentTime = playbackTime; 
        };
        var canplay = function(){
            // FIXME: would be nice to not have an arbitrary delay of 30ms, and
            // instead key off of an event when we know the poster can be captured
            JSTimer.scheduledTimerWithInterval(JSTimeInterval.milliseconds(30), capture);
        };
        var capture = function(){
            var canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            var context = canvas.getContext("2d");
            context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            canvas.toBlob(function(blob){
                var reader = new FileReader();
                reader.addEventListener("loadend", function(){
                    video.removeEventListener("loadmetadata", loadmetadata);
                    video.removeEventListener("canplay", canplay);
                    if (reader.error){
                        logger.error("Error reading blob: %{error}", reader.error);
                        completion.call(target, null);
                        return;
                    }
                    var data = JSData.initWithBuffer(reader.result);
                    var image = JSImage.initWithData(data);
                    completion.call(target, image);
                });
                reader.readAsArrayBuffer(blob);
            }, "image/jpeg");
        };
        video.addEventListener("loadmetadata", loadmetadata);
        video.addEventListener("canplay", canplay);
        if (this.isKindOfClass(MKHTMLStream)){
            video.srcObject = this.htmlMediaStream;
        }else if (this.isKindOfClass(MKRemoteAsset)){
            video.src = this.url.encodedString;
        }else{
            logger.warning("unsupported asset class: %{public}", this.$class.className);
            JSRunLoop.main.schedule(completion, target, null);
        }
        return completion.promise;
    },

});

})();