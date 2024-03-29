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

// #import SearchKit
// #import TestKit
"use strict";

JSClass("SERankerTests", TKTestSuite, {

    testHitsByDocument: function(){
        var words = ["one"];
        var hitsByWord = [
            [[0, 0, 0], [0, 0, 5], [0, 1, 0], [1, 0, 0], [1, 1, 0], [1, 1, 1]]
        ];
        var ranker = SERanker.initWithWords(words, hitsByWord);
        var hitsByDocument = ranker.hitsByDocument();
        TKAssertEquals(hitsByDocument.length, 2);
        TKAssertEquals(hitsByDocument[0].length, 1);
        TKAssertEquals(hitsByDocument[0][0].length, 3);
        TKAssertEquals(hitsByDocument[0][0][0].length, 3);
        TKAssertEquals(hitsByDocument[0][0][1].length, 3);
        TKAssertEquals(hitsByDocument[0][0][2].length, 3);
        TKAssertExactEquals(hitsByDocument[0][0][0][0], 0);
        TKAssertExactEquals(hitsByDocument[0][0][0][1], 0);
        TKAssertExactEquals(hitsByDocument[0][0][0][2], 0);
        TKAssertExactEquals(hitsByDocument[0][0][1][0], 0);
        TKAssertExactEquals(hitsByDocument[0][0][1][1], 0);
        TKAssertExactEquals(hitsByDocument[0][0][1][2], 5);
        TKAssertExactEquals(hitsByDocument[0][0][2][0], 0);
        TKAssertExactEquals(hitsByDocument[0][0][2][1], 1);
        TKAssertExactEquals(hitsByDocument[0][0][2][2], 0);
        TKAssertEquals(hitsByDocument[1].length, 1);
        TKAssertEquals(hitsByDocument[1][0].length, 3);
        TKAssertEquals(hitsByDocument[1][0][0].length, 3);
        TKAssertEquals(hitsByDocument[1][0][1].length, 3);
        TKAssertEquals(hitsByDocument[1][0][2].length, 3);
        TKAssertExactEquals(hitsByDocument[1][0][0][0], 1);
        TKAssertExactEquals(hitsByDocument[1][0][0][1], 0);
        TKAssertExactEquals(hitsByDocument[1][0][0][2], 0);
        TKAssertExactEquals(hitsByDocument[1][0][1][0], 1);
        TKAssertExactEquals(hitsByDocument[1][0][1][1], 1);
        TKAssertExactEquals(hitsByDocument[1][0][1][2], 0);
        TKAssertExactEquals(hitsByDocument[1][0][2][0], 1);
        TKAssertExactEquals(hitsByDocument[1][0][2][1], 1);
        TKAssertExactEquals(hitsByDocument[1][0][2][2], 1);
    }

});