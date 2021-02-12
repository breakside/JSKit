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

// #import "SERanker.js"
"use strict";

JSClass("SEStandardRanker", SERanker, {

});

SEStandardRanker.hitCompare = function(a, b){
    var wordIndex, wordCount;
    var hitIndex, hitCount;
    var hitValue = 1;
    var field1HitBonus = 1;
    var scoreA = 0;
    var scoreB = 0;
    for (wordIndex = 0, wordCount = a.length; wordIndex < wordCount; ++wordIndex){
        for (hitIndex = 0, hitCount = a[wordIndex].length; hitIndex < hitCount; ++hitIndex){
            scoreA += hitValue;
            if (a[wordIndex][hitIndex][1] === 0){
                scoreA += field1HitBonus;
            }
        }
        for (hitIndex = 0, hitCount = b[wordIndex].length; hitIndex < hitCount; ++hitIndex){
            scoreB += hitValue;
            if (b[wordIndex][hitIndex][1] === 0){
                scoreB += field1HitBonus;
            }
        }
    }
    return scoreB - scoreA;
};