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

JSProtocol("UIDraggingDestination", JSProtocol, {

    draggingEntered: function(session){},
    draggingUpdated: function(session){},
    draggingExited: function(session){},

    performDragOperation: function(session, operation){}

});

JSGlobalObject.UIDragOperation = {
    none: 0,
    copy: 1,
    link: 2,
    move: 4,
    all: 7
};