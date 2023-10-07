// Copyright 2023 Breakside Inc.
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
'use strict';

JSClass("MKRemoteAsset", MKAsset, {

    url: null,
    contentType: null,

    initWithURL: function(url, contentType){
        this.url = url;
        this.contentType = contentType;
    },

    isEqual: function(other){
        if (other === null || other === undefined){
            return false;
        }
        if (!other.isKindOfClass(MKRemoteAsset)){
            return false;
        }
        return this.url.isEqual(other.url);
    }

});