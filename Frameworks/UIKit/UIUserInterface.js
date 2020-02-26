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

JSClass("UIUserInterface", JSObject, {

});

UIUserInterface.SizeClass = {
    unspecified: 0,
    compact: 1,
    regular: 2,

    fromLength: function(length){
        if (length < 550){
            return UIUserInterface.SizeClass.compact;
        }
        return UIUserInterface.SizeClass.regular;
    }
};

UIUserInterface.PointerType = {
    unspecified: 0,
    cursor: 1,
    touch: 2
};

UIUserInterface.PointerAccuracy = {
    unspecified: 0,
    coarse: 1,
    fine: 2
};