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

// #import Foundation
'use strict';

JSClass("UIAlertAction", JSObject, {

    initWithTitle: function(title, style, action, target){
        this.title = title;
        this.style = style || 0;
        this.action = action || null;
        this.target = target || null;
    },

    title: null,
    style: 0,
    action: null,
    target: null,

    perform: function(){
        if (this.action){
            this.action.call(this.target);
        }
    }

});

UIAlertAction.Style = {
    normal: 0,
    default: 1,
    cancel: 2,
    destructive: 3
};