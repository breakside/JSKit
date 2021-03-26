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

'use strict';

JSGlobalObject.CSSOM = Object.create({}, {

    StyleSheet: {
        value: function StyleSheet(){
            throw new Error("use createCSSStyleSheet");
        }
    },

    CSSStyleSheet: {
        value: function CSSStyleSheet(){
            throw new Error("use createCSSStyleSheet");
        }
    },

    CSSRuleList: {
        value: function CSSRuleList(){
            throw new Error("use createCSSStyleSheet");
        }
    },

    CSSRule: {
        value: function CSSRuleList(){
            throw new Error("use CSSStyleSheet.insertRule()");
        }
    },

    createCSSStyleSheet: function(){
        var sheet = Object.create(CSSOM.CSSStyleSheet, {
            type: {value: "text/css"},
            cssRules: Object.create(CSSOM.CSSRuleList, {
                _rules: {value: []}
            })
        });
        return sheet;
    }

});