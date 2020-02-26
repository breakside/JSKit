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

// #import "DocMethod.js"
'use strict';

JSClass("DocConstructor", DocMethod, {

    kind: 'constructor',

    declarationCode: function(){
        var args = this.argumentStrings();
        return ["function %s(%s)".sprintf(this.parent.name, args.join(', '))];
    },

    getTitle: function(){
        return "%s %s".sprintf(this.parent.name, this.getTitleWithoutParent());
    },

    getTitleWithoutParent: function(){
        if (this.uniquePrefix){
            var words = this.uniquePrefix.split('-');
            for (let i = 0, l = words.length; i < l; ++i){
                words[i] = words[i].capitalizedString();
            }
            return "%s Constructor".sprintf(words.join(" "));
        }
        return "Constructor";
    },

    getBaseName: function(){
        return "constructor";
    },

    getDisplayNameForKind: function(){
        return "Constructor";
    }

});