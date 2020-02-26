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

(function(){

var numberCompare = function(a, b){ return a - b; };

JSClass("JSMathTests", TKTestSuite, {

    testIsAcceptablyEquivalent: function(){
        var eq = JSMath.isAcceptablyEquivalent(0, 0);
        TKAssert(eq);
        eq = JSMath.isAcceptablyEquivalent(0.0000001, 0);
        TKAssert(eq);
        eq = JSMath.isAcceptablyEquivalent(0.00000099999, 0);
        TKAssert(eq);
        eq = JSMath.isAcceptablyEquivalent(0.000001, 0);
        TKAssert(!eq);
        eq = JSMath.isAcceptablyEquivalent(0.00001, 0);
        TKAssert(!eq);
    },

    testSolveLinear: function(){
        var x = JSMath.solveLinear(0, 15);
        TKAssertEquals(x.length, 0);

        x = JSMath.solveLinear(1, 0);
        TKAssertEquals(x.length, 1);
        TKAssertFloatEquals(x[0], 0);

        x = JSMath.solveLinear(1, 2);
        TKAssertEquals(x.length, 1);
        TKAssertFloatEquals(x[0], -2);

        x = JSMath.solveLinear(2, 5);
        TKAssertEquals(x.length, 1);
        TKAssertFloatEquals(x[0], -2.5);
    },

    testSolveQuadratic: function(){
        var x = JSMath.solveQuadradic(0, 5, 10);
        TKAssertEquals(x.length, 1);
        TKAssertFloatEquals(x[0], -2);

        x = JSMath.solveQuadradic(0, 0, 10);
        TKAssertEquals(x.length, 0);

        x = JSMath.solveQuadradic(1, 0, 0);
        TKAssertEquals(x.length, 1);
        TKAssertFloatEquals(x[0], 0);

        x = JSMath.solveQuadradic(1, 2, 0);
        TKAssertEquals(x.length, 2);
        x.sort(numberCompare);
        TKAssertFloatEquals(x[0], -2);
        TKAssertFloatEquals(x[1], 0);

        x = JSMath.solveQuadradic(1, 2, 3);
        TKAssertEquals(x.length, 0);

        x = JSMath.solveQuadradic(1, 2, -3);
        TKAssertEquals(x.length, 2);
        x.sort(numberCompare);
        TKAssertFloatEquals(x[0], -3);
        TKAssertFloatEquals(x[1], 1);
    },

    testSolveCubic: function(){
        var x = JSMath.solveCubic(0, 1, 2, -3);
        TKAssertEquals(x.length, 2);
        x.sort(numberCompare);
        TKAssertFloatEquals(x[0], -3);
        TKAssertFloatEquals(x[1], 1);

        x = JSMath.solveCubic(0, 0, 2, -3);
        TKAssertEquals(x.length, 1);
        TKAssertFloatEquals(x[0], 1.5);

        x = JSMath.solveCubic(0, 0, 0, -3);
        TKAssertEquals(x.length, 0);

        x = JSMath.solveCubic(1, 0, 0, 0);
        TKAssertEquals(x.length, 1);
        TKAssertFloatEquals(x[0], 0);

        x = JSMath.solveCubic(1, 2, 0, 0);
        TKAssertEquals(x.length, 2);
        x.sort(numberCompare);
        TKAssertFloatEquals(x[0], -2);
        TKAssertFloatEquals(x[1], 0);

        x = JSMath.solveCubic(1, 2, -3, 0);
        TKAssertEquals(x.length, 3);
        x.sort(numberCompare);
        TKAssertFloatEquals(x[0], -3);
        TKAssertFloatEquals(x[1], 0);
        TKAssertFloatEquals(x[2], 1);

        x = JSMath.solveCubic(1, 2, -3, 4);
        TKAssertEquals(x.length, 1);
        TKAssertFloatEquals(x[0], -3.284277);
    }

});

})();