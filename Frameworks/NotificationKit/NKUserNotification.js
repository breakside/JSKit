// Copyright 2021 Breakside Inc.
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
"use strict";

JSClass("NKUserNotification", JSObject, {

    title: null,
    body: null,
    identifier: null,
    timeToLive: 3600,
    priority: 0,

    initWithTitle: function(title, body){
        this.title = title;
        this.body = body || null;
        this.identifier = UUID();
    }

});

NKUserNotification.Priority = {

    normal: 0,
    veryLow: 1,
    low: 2,
    high: 3,

};