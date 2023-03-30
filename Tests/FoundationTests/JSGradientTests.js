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
    },

    testColorAtPosition: function(){
        var gradient = JSGradient.init();
        gradient.addStop(0, JSColor.black);
        gradient.addStop(1, JSColor.white);
        var color = gradient.colorAtPosition(-1);
        TKAssertFloatEquals(color.white, 0);
        color = gradient.colorAtPosition(0);
        TKAssertFloatEquals(color.white, 0);
        color = gradient.colorAtPosition(0.1);
        TKAssertFloatEquals(color.white, 0.1);
        color = gradient.colorAtPosition(0.2);
        TKAssertFloatEquals(color.white, 0.2);
        color = gradient.colorAtPosition(0.5);
        TKAssertFloatEquals(color.white, 0.5);
        color = gradient.colorAtPosition(0.9);
        TKAssertFloatEquals(color.white, 0.9);
        color = gradient.colorAtPosition(1);
        TKAssertFloatEquals(color.white, 1);
        color = gradient.colorAtPosition(2);
        TKAssertFloatEquals(color.white, 1);

        gradient = JSGradient.init();
        gradient.addStop(0.2, JSColor.black);
        gradient.addStop(0.8, JSColor.white);
        color = gradient.colorAtPosition(-1);
        TKAssertFloatEquals(color.white, 0);
        color = gradient.colorAtPosition(0);
        TKAssertFloatEquals(color.white, 0);
        color = gradient.colorAtPosition(0.1);
        TKAssertFloatEquals(color.white, 0);
        color = gradient.colorAtPosition(0.2);
        TKAssertFloatEquals(color.white, 0);
        color = gradient.colorAtPosition(0.4);
        TKAssertFloatEquals(color.white, 1/3);
        color = gradient.colorAtPosition(0.5);
        TKAssertFloatEquals(color.white, 0.5);
        color = gradient.colorAtPosition(0.6);
        TKAssertFloatEquals(color.white, 2/3);
        color = gradient.colorAtPosition(0.8);
        TKAssertFloatEquals(color.white, 1);
        color = gradient.colorAtPosition(0.9);
        TKAssertFloatEquals(color.white, 1);
        color = gradient.colorAtPosition(1);
        TKAssertFloatEquals(color.white, 1);
        color = gradient.colorAtPosition(2);
        TKAssertFloatEquals(color.white, 1);

        gradient = JSGradient.init();
        gradient.addStop(0.2, JSColor.black);
        gradient.addStop(0.6, JSColor.white);
        gradient.addStop(0.7, JSColor.black);
        color = gradient.colorAtPosition(-1);
        TKAssertFloatEquals(color.white, 0.0);
        color = gradient.colorAtPosition(0.0);
        TKAssertFloatEquals(color.white, 0.0);
        color = gradient.colorAtPosition(0.1);
        TKAssertFloatEquals(color.white, 0.0);
        color = gradient.colorAtPosition(0.2);
        TKAssertFloatEquals(color.white, 0.0);
        color = gradient.colorAtPosition(0.4);
        TKAssertFloatEquals(color.white, 0.5);
        color = gradient.colorAtPosition(0.6);
        TKAssertFloatEquals(color.white, 1.0);
        color = gradient.colorAtPosition(0.625);
        TKAssertFloatEquals(color.white, 0.75);
        color = gradient.colorAtPosition(0.65);
        TKAssertFloatEquals(color.white, 0.5);
        color = gradient.colorAtPosition(0.675);
        TKAssertFloatEquals(color.white, 0.25);
        color = gradient.colorAtPosition(0.7);
        TKAssertFloatEquals(color.white, 0.0);
        color = gradient.colorAtPosition(1.0);
        TKAssertFloatEquals(color.white, 0.0);
        color = gradient.colorAtPosition(2.0);
        TKAssertFloatEquals(color.white, 0.0);
    },

    testGradientBetweenPositions: function(){
        var gradient = JSGradient.init();
        gradient.addStop(0.2, JSColor.black);
        gradient.addStop(0.6, JSColor.white);
        gradient.addStop(0.7, JSColor.black);

        var gradient2 = gradient.gradientBetweenPositions(0, 1);
        TKAssertExactEquals(gradient2.stops.length, 3);
        TKAssertFloatEquals(gradient2.stops[0].position, 0.2);
        TKAssertFloatEquals(gradient2.stops[0].color.white, 0.0);
        TKAssertFloatEquals(gradient2.stops[1].position, 0.6);
        TKAssertFloatEquals(gradient2.stops[1].color.white, 1.0);
        TKAssertFloatEquals(gradient2.stops[2].position, 0.7);
        TKAssertFloatEquals(gradient2.stops[2].color.white, 0.0);

        gradient2 = gradient.gradientBetweenPositions(0, 0.5);
        TKAssertExactEquals(gradient2.stops.length, 2);
        TKAssertFloatEquals(gradient2.stops[0].position, 0.4);
        TKAssertFloatEquals(gradient2.stops[0].color.white, 0.0);
        TKAssertFloatEquals(gradient2.stops[1].position, 1.0);
        TKAssertFloatEquals(gradient2.stops[1].color.white, 0.75);

        gradient2 = gradient.gradientBetweenPositions(0.2, 0.6);
        TKAssertExactEquals(gradient2.stops.length, 2);
        TKAssertFloatEquals(gradient2.stops[0].position, 0.0);
        TKAssertFloatEquals(gradient2.stops[0].color.white, 0.0);
        TKAssertFloatEquals(gradient2.stops[1].position, 1.0);
        TKAssertFloatEquals(gradient2.stops[1].color.white, 1.0);

        gradient2 = gradient.gradientBetweenPositions(0.65, 0.675);
        TKAssertExactEquals(gradient2.stops.length, 2);
        TKAssertFloatEquals(gradient2.stops[0].position, 0.0);
        TKAssertFloatEquals(gradient2.stops[0].color.white, 0.5);
        TKAssertFloatEquals(gradient2.stops[1].position, 1.0);
        TKAssertFloatEquals(gradient2.stops[1].color.white, 0.25);

        gradient2 = gradient.gradientBetweenPositions(0.65, 0.7);
        TKAssertExactEquals(gradient2.stops.length, 2);
        TKAssertFloatEquals(gradient2.stops[0].position, 0.0);
        TKAssertFloatEquals(gradient2.stops[0].color.white, 0.5);
        TKAssertFloatEquals(gradient2.stops[1].position, 1.0);
        TKAssertFloatEquals(gradient2.stops[1].color.white, 0.0);

        gradient2 = gradient.gradientBetweenPositions(0.65, 0.8);
        TKAssertExactEquals(gradient2.stops.length, 2);
        TKAssertFloatEquals(gradient2.stops[0].position, 0.0);
        TKAssertFloatEquals(gradient2.stops[0].color.white, 0.5);
        TKAssertFloatEquals(gradient2.stops[1].position, 1/3);
        TKAssertFloatEquals(gradient2.stops[1].color.white, 0);
    }

});