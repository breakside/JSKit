// Copyright 2022 Breakside Inc.
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

// #import ImageKit
// #import TestKit
'use strict';

JSClass("IKMatrixTests", TKTestSuite, {

    testConstructor: function(){
        var m = IKMatrix([[1], [2]]);
        TKAssertExactEquals(m.rows, 2);
        TKAssertExactEquals(m.columns, 1);
        m = IKMatrix([[1, 2]]);
        TKAssertExactEquals(m.rows, 1);
        TKAssertExactEquals(m.columns, 2);
        m = IKMatrix([[1, 2], [3, 4]]);
        TKAssertExactEquals(m.rows, 2);
        TKAssertExactEquals(m.columns, 2);
        m = IKMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
        TKAssertExactEquals(m.rows, 3);
        TKAssertExactEquals(m.columns, 3);
    },

    testDeterminant: function(){
        var m = IKMatrix([[1, 2], [3, 4]]);
        var d = m.determinant();
        TKAssertExactEquals(d, -2);
        m = IKMatrix([[1, 2, 3], [4, 5, 6], [7, 8, 9]]);
        d = m.determinant();
        TKAssertExactEquals(d, 0);
        m = IKMatrix([[0.436065673828125, 0.3851470947265625, 0.14306640625], [0.2224884033203125, 0.7168731689453125, 0.06060791015625], [0.013916015625, 0.097076416015625, 0.7140960693359375]]);
        d = m.determinant();
        TKAssertFloatEquals(d, 0.16146, 0.00001);
    },

    testMultiplied: function(){
        var m = IKMatrix([[1, 2], [3, 4]]);
        var m2 = m.multiplied(2);
        TKAssertEquals(m2[0][0], 2);
        TKAssertEquals(m2[0][1], 4);
        TKAssertEquals(m2[1][0], 6);
        TKAssertEquals(m2[1][1], 8);

        m = IKMatrix([[1, 2], [3, 4]]);
        m2 = m.multiplied(0.5);
        TKAssertFloatEquals(m2[0][0], 0.5);
        TKAssertFloatEquals(m2[0][1], 1);
        TKAssertFloatEquals(m2[1][0], 1.5);
        TKAssertFloatEquals(m2[1][1], 2);
    },

    testInverse: function(){
        var m = IKMatrix([[1, 2], [3, 4]]);
        var m2 = m.inverse();
        TKAssertFloatEquals(m2[0][0], -2);
        TKAssertFloatEquals(m2[0][1], 1);
        TKAssertFloatEquals(m2[1][0], 1.5);
        TKAssertFloatEquals(m2[1][1], -0.5);

        m = IKMatrix([[2, 3, 1], [4, 5, 6], [7, 8, 9]]);
        m2 = m.inverse();
        TKAssertFloatEquals(m2[0][0], -1/3);
        TKAssertFloatEquals(m2[0][1], -19/9);
        TKAssertFloatEquals(m2[0][2], 13/9);
        TKAssertFloatEquals(m2[1][0], 2/3);
        TKAssertFloatEquals(m2[1][1], 11/9);
        TKAssertFloatEquals(m2[1][2], -8/9);
        TKAssertFloatEquals(m2[2][0], -1/3);
        TKAssertFloatEquals(m2[2][1], 5/9);
        TKAssertFloatEquals(m2[2][2], -2/9);

        m = IKMatrix([[0.436065673828125, 0.3851470947265625, 0.14306640625], [0.2224884033203125, 0.7168731689453125, 0.06060791015625], [0.013916015625, 0.097076416015625, 0.7140960693359375]]);
        m2 = m.inverse();
        TKAssertFloatEquals(m2[0][0], 3.1341121533, 0.0000000001);
        TKAssertFloatEquals(m2[0][1], -1.6173924596, 0.0000000001);
        TKAssertFloatEquals(m2[0][2], -0.49063340456, 0.0000000001);
        TKAssertFloatEquals(m2[1][0], -0.97878729614, 0.0000000001);
        TKAssertFloatEquals(m2[1][1], 1.9162795864, 0.0000000001);
        TKAssertFloatEquals(m2[1][2], 0.033454714231, 0.0000000001);
        TKAssertFloatEquals(m2[2][0], 0.071983044386, 0.0000000001);
        TKAssertFloatEquals(m2[2][1], -0.22898585025, 0.0000000001);
        TKAssertFloatEquals(m2[2][2], 1.4053851316, 0.0000000001);
    }

});