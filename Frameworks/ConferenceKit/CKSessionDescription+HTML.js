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

// #import "CKSessionDescription.js"
// jshint browser: true
/* global RTCSessionDescription */
'use strict';

(function(){

CKSessionDescription.definePropertiesFromExtensions({

    initWithHTMLDescription: function(htmlDescription){
        this.type = descriptionTypesByHTMLType[htmlDescription.type];
        this.value = htmlDescription.sdp;
    },

    htmlDescription: function(){
        return new RTCSessionDescription({
            type: htmlDescriptionTypesByType[this.type],
            sdp: this.value
        });
    }

});

CKSessionDescription.defineInitMethod("initWithHTMLDescription");

var htmlDescriptionTypesByType = {};

var descriptionTypesByHTMLType = {
    "offer": CKSessionDescription.Type.offer,
    "answer": CKSessionDescription.Type.answer,
    "pranswer": CKSessionDescription.Type.provisionalAnswer,
    "rollback": CKSessionDescription.Type.rollback
};

for (var htmlType in descriptionTypesByHTMLType){
    htmlDescriptionTypesByType[descriptionTypesByHTMLType[htmlType]] = htmlType;
}

})();