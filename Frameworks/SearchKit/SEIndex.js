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
// #import "SEStandardTokenizer.js"
// #import "SEStandardRanker.js"
// #import "SEIndexMemoryStore.js"
"use strict";

JSClass("SEIndex", JSObject, {

    initInMemory: function(){
        var store = SEIndexMemoryStore.init();
        this.initWithStore(store);
    },

    initWithStore: function(store){
        this.store = store;
    },

    // ----------------------------------------------------------------------
    // MARK: - Store

    store: null,

    // ----------------------------------------------------------------------
    // MARK: - Indexing

    tokenizerClass: SEStandardTokenizer,

    addDocument: function(document, completion, target){
        this.store.addDocument(document, this.tokenizerClass, function(){
            if (completion){
                completion.call(target);
            }
        }, this);
    },

    // ----------------------------------------------------------------------
    // MARK: - Searching

    rankerClass: SEStandardRanker,

    search: function(string, completion, target){
        var tokenizer = this.tokenizerClass.initWithString(string);
        var token = tokenizer.next();
        var words = [];
        var wordOptions = [];
        while (token !== null){
            words.push(token);
            wordOptions.push({isPrefix: true});
            token = tokenizer.next();
        }
        this.store.search(words, wordOptions, this.rankerClass, function(documentIDs){
            completion.call(target, documentIDs);
        }, this);
    },

    close: function(completion, target){
        this.store.close(function(){
            completion.call(target);
        }, this);
    }

});