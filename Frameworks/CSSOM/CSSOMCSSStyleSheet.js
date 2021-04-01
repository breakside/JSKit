// Copyright 2021 Breakside Inc.
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

// #import "CSSOMBase.js"
"use strict";

CSSOM.CSSStyleSheet.prototype = Object.create(CSSOM.StyleSheet, {
    
    constructor: {
        value: CSSOM.CSSStyleSheet
    },

    ownerRule: {configurable: true, value: null},
    cssRules: {configurable: true, value: null},
    
    insertRule: {
        value: function CSSStyleSheet_insertRule(cssText, index){
            if (index === undefined){
                index = 0;
            }
            // FIXME: parse text into appropriate CSSRule subclass
            var rule = Object.create(CSSOM.CSSRule, {
                cssText: {value: cssText},
                parentStyleSheet: {value: this}
            });
            this.cssRules._rules.splice(index, 0, rule);
        }
    },
    
    deleteRule: {
        value: function CSSStyleSheet_insertRule(index){
            this.cssRules._rules.splice(index, 1);
        }
    },

});