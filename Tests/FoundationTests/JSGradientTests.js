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
// #import TestKit
'use strict';

JSClass('JSGradientTests', TKTestSuite, {

    testRotated: function(){
        var gradient = JSGradient.init();
        gradient.addStop(0, JSColor.black);
        gradient.addStop(1, JSColor.white);
        TKAssertFloatEquals(gradient.start.x, 0);
        TKAssertFloatEquals(gradient.start.y, 0);
        TKAssertFloatEquals(gradient.end.x, 0);
        TKAssertFloatEquals(gradient.end.y, 1);

        var rotated = gradient.rotated(Math.PI);
        TKAssertFloatEquals(rotated.start.x, 1);
        TKAssertFloatEquals(rotated.start.y, 1);
        TKAssertFloatEquals(rotated.end.x, 1);
        TKAssertFloatEquals(rotated.end.y, 0);

        rotated = gradient.rotated(Math.PI / 2);
        TKAssertFloatEquals(rotated.start.x, 1);
        TKAssertFloatEquals(rotated.start.y, 0);
        TKAssertFloatEquals(rotated.end.x, 0);
        TKAssertFloatEquals(rotated.end.y, 0);

        rotated = gradient.rotated(-Math.PI / 2);
        TKAssertFloatEquals(rotated.start.x, 0);
        TKAssertFloatEquals(rotated.start.y, 1);
        TKAssertFloatEquals(rotated.end.x, 1);
        TKAssertFloatEquals(rotated.end.y, 1);
    }

});