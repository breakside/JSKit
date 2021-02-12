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
"use strict";

JSClass("SERanker", JSObject, {

    initWithWords: function(words, hitsByWord){
        this.words = words;
        this.hitsByWord = hitsByWord;
    },

    hitsByDocument: function(){
        var hits;
        var hit;
        var wordIndex, wordCount;
        var hitIndex, hitCount;
        var hitsByDocument = [];
        var documentIndexMap = {};
        var documentIndex;
        for (wordIndex = 0, wordCount = this.hitsByWord.length; wordIndex < wordCount; ++wordIndex){
            hits = this.hitsByWord[wordIndex];
            for (hitIndex = 0, hitCount = hits.length; hitIndex < hitCount; ++hitIndex){
                hit = hits[hitIndex];
                documentIndex = documentIndexMap[hit[0]];
                if (documentIndex === undefined){
                    documentIndex = hitsByDocument.length;
                    documentIndexMap[hit[0]] = documentIndex;
                    hitsByDocument.push([]);
                }
                if (hitsByDocument[documentIndex][wordIndex] === undefined){
                    hitsByDocument[documentIndex][wordIndex] = [];
                }
                hitsByDocument[documentIndex][wordIndex].push(hit);
            }
        }
        return hitsByDocument;
    },

    rankedDocumentNumbers: function(){
        var hitsByDocument = this.hitsByDocument();
        var documentIndex, documentCount;
        var wordIndex, wordCount;
        var hits;
        for (documentIndex = hitsByDocument.length - 1; documentIndex >= 0; --documentIndex){
            hits = hitsByDocument[documentIndex];
            for (wordIndex = 0, wordCount = this.words.length; wordIndex < wordCount; ++wordIndex){
                if (!hits[wordIndex]){
                    hitsByDocument.splice(documentIndex, 1);
                    break;
                }
            }
        }
        hitsByDocument.sort(this.$class.hitCompare);
        var documentNumbers = [];
        for (documentIndex = 0, documentCount = hitsByDocument.length; documentIndex < documentCount; ++documentIndex){
            documentNumbers.push(hitsByDocument[documentIndex][0][0][0]);
        }
        return documentNumbers;
    }

});

SERanker.hitCompare = function(a, b){
    return a[0][0][0] - b[0][0][0];
};