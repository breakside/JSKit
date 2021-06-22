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

// #import Foundation
"use strict";

JSClass("CHTheme", JSObject, {

    initWithColors: function(colors){
        this.colors = JSCopy(colors);
    },

    colors: null

});

Object.defineProperties(CHTheme, {
    default: {
        configurable: true,
        get: function(){
            var colors = [
                JSColor.initWithRGBAHexString("3399CC"),
                JSColor.initWithRGBAHexString("33CC80"),
                JSColor.initWithRGBAHexString("CC9933"),
                JSColor.initWithRGBAHexString("CC3333"),
                JSColor.initWithRGBAHexString("8033CC")
            ];
            var theme = CHTheme.initWithColors(colors);
            Object.defineProperty(this, "default", {value: theme});
            return theme;
        }
    }
});