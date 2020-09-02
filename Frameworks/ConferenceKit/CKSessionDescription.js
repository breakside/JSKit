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

JSClass("CKSessionDescription", JSObject, {

    initWithType: function(type, value){
        this.type = type;
        this.value = value;
    }

});

CKSessionDescription.Type = {
    offer: 1,
    answer: 2,
    provisionalAnswer: 3,
    rollback: 4
};