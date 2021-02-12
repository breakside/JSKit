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

JSClass("SETokenizer", JSObject, {

    initWithString: function(str){
    },

    next: function(){
        return null;
    },

    all: function(){
        var tokens = [];
        var token = this.next();
        while (token !== null){
            tokens.push(token);
            token = this.next();
        }
        return tokens;
    }

});

SETokenizer.tokenizedFieldsFromDocument = function(document, tokenizerClass){
    var string;
    var tokens = {};
    var tokenizer;
    var token;
    for (var field in document){
        if (field !== "id" && field[0] !== "_"){
            string = document[field];
            tokenizer = tokenizerClass.initWithString(string);
            tokens[field] = [];
            token = tokenizer.next();
            while (token !== null){
                tokens[field].push(token);
                token = tokenizer.next();
            }
        }
    }
    return tokens;
};