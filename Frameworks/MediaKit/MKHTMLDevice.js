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

// #import "MKDevice.js"
'use strict';

JSClass("MKHTMLDevice", MKDevice, {

    initWithMediaDeviceInfo: function(mediaDeviceInfo){
        this.mediaDeviceInfo = mediaDeviceInfo;
        this.displayName = this.mediaDeviceInfo.label;
        switch (this.mediaDeviceInfo.kind){
            case "audioinput":
                this.type = MKDevice.Type.audio;
                this.direction = MKDevice.Direction.input;
                break;
            case "audiooutput":
                this.type = MKDevice.Type.audio;
                this.direction = MKDevice.Direction.output;
                break;
            case "videoinput":
                this.type = MKDevice.Type.video;
                this.direction = MKDevice.Direction.input;
                break;
        }
    },

    mediaDeviceInfo: null,

});