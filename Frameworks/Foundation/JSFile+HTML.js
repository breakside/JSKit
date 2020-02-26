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

// #import "JSFile.js"
// #import "JSURL.js"
// #feature URL.revokeObjectURL
// jshint browser: true
'use strict';

(function(){

var originalClose = JSDataFile.prototype.close;

JSDataFile.definePropertiesFromExtensions({

    _dataURL: null,

    close: function(){
        originalClose.call(this);
        if (this._dataURL !== null){
            URL.revokeObjectURL(this._dataURL);
        }
    },

    getURL: function(){
        if (this._dataURL === null){
            var urlString = this._data.htmlURLString();
            this._dataURL = JSURL.initWithString(urlString);
        }
        return this._dataURL;
    }
});

})();