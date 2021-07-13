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

// #import "JSData.js"
// #feature Blob
// #feature URL.createObjectURL
// jshint browser: true
'use strict';

Object.defineProperties(JSData.prototype, {

    htmlURLString: {
        value: function JSData_htmlURLString(contentType){
            if (!this._blobURL){
                var options = {};
                if (contentType){
                    options.type = contentType.mime;
                }
                this._blob = new Blob([this], options);
                this._blobURL = URL.createObjectURL(this._blob);
            }
            return this._blobURL;
        }
    },

    htmlCleanup: {
        value: function JSData_htmlCleanup(){
            if (this._blobURL){
                URL.revokeObjectURL(this._blobURL);
                delete this._blobURL;
                delete this._blob;
            }
        }
    }
});